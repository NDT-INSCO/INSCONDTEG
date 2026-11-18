import { jsPDF } from 'jspdf';
import type { CompanyInspectionReport, CompanyRecord } from './types';
import { getReportTemplate } from './reportTemplates';
import { buildCompanyDossierUrl, drawVectorQrOnPdf } from './companyQr';

export function exportCompanyInspectionReportPdf(
  company: CompanyRecord,
  report: CompanyInspectionReport
): string {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const template = getReportTemplate(report.templateKey || report.method);
  const dossierUrl = buildCompanyDossierUrl(company.id);

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.text('INSCO - INTERNATIONAL SERVICES & CONTRACTING', 14, 11, { maxWidth: 156 });
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${template.titleEn}  |  Method: ${report.method}`, 14, 18.5, { maxWidth: 156 });
  doc.text(`Company Code: ${company.companyCode}   |   Report No: ${report.reportNumber}`, 14, 24.5, {
    maxWidth: 156,
  });

  // Scannable vector QR code linking directly to company's live dossier
  drawVectorQrOnPdf(doc, dossierUrl, 176, 4, 22, 1);

  // Meta grid
  let y = 38;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT & COMPONENT INFORMATION', 14, y);
  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.line(14, y, 196, y);
  y += 6;

  const metaRows: Array<[string, string]> = [
    ['Company', `${company.nameEn} (${company.companyCode})`],
    ['Project / Work Order', report.projectName],
    ['Client PO / Contract', report.clientPoNumber || '-'],
    ['Component / Weld ID', report.componentOrJointId],
    ['Material / Thickness', `${report.materialSpec || '-'}  |  ${report.thicknessMm || '-'} mm`],
    ['Governing Code', report.codeStandard],
    ['Inspection Date', report.inspectionDate],
    ['Inspector / Engineer', report.inspectorName],
    ['Status / Origin', `${report.status.toUpperCase()} (${report.isLegacyArchive ? 'Legacy Archive' : 'Portal Entry'})`],
    ['Final Verdict', report.verdict],
  ];

  doc.setFontSize(9.5);
  for (const [label, val] of metaRows) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    doc.text(String(val).slice(0, 80), 62, y);
    y += 6.2;
  }

  // Technical parameters
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TECHNICAL EXAMINATION DATA', 14, y);
  y += 4;
  doc.line(14, y, 196, y);
  y += 6;
  doc.setFontSize(9.5);

  for (const field of template.fields) {
    const rawVal = report.technicalData?.[field.key];
    if (rawVal === undefined || rawVal === '') continue;
    doc.setFont('helvetica', 'bold');
    doc.text(`${field.labelEn}:`, 14, y);
    doc.setFont('helvetica', 'normal');
    const unitSuffix = field.unit ? ` ${field.unit}` : '';
    doc.text(`${String(rawVal)}${unitSuffix}`.slice(0, 80), 68, y);
    y += 6;
    if (y > 268) {
      doc.addPage();
      y = 20;
    }
  }

  const customRows = Array.isArray(report.technicalData?.customFields)
    ? report.technicalData.customFields
    : [];
  if (customRows.length > 0) {
    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.text('ADDITIONAL / CUSTOM REPORT FIELDS', 14, y);
    y += 5;
    for (const row of customRows) {
      if (!row?.label) continue;
      doc.setFont('helvetica', 'bold');
      doc.text(`${row.label}:`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${row.value || '-'}${row.unit ? ` ${row.unit}` : ''}`.slice(0, 80), 68, y);
      y += 6;
      if (y > 268) {
        doc.addPage();
        y = 20;
      }
    }
  }

  if (report.notes) {
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('INSPECTOR REMARKS & NOTES:', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(report.notes, 180);
    doc.text(lines, 14, y);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `INSCO Client Dossier System · ${company.companyCode} · ${report.reportNumber} · Generated ${new Date().toISOString().slice(0, 10)}`,
    14,
    288
  );

  const safeFile = `${report.reportNumber.replace(/[^A-Z0-9_-]/gi, '_')}.pdf`;
  doc.save(safeFile);
  return safeFile;
}
