import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { BLUEPRINT_LIMITS, type CompanyRecord } from './types';

const FALLBACK_APP_BASE = 'https://ndt-insco.github.io/INSCONDTEG/';

export interface QrVectorGeometry {
  size: number;
  margin: number;
  totalSize: number;
  pathData: string;
}

export function isValidCompanyIdSlug(companyId: string): boolean {
  const trimmed = companyId.trim();
  return (
    trimmed.length >= 1 &&
    trimmed.length <= 128 &&
    BLUEPRINT_LIMITS.ID_REGEX.test(trimmed)
  );
}

export function sanitizeCompanyIdSlug(raw: string): string {
  return raw.trim().replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
}

/**
 * Resolves the canonical URL pointing straight to an individual company's
 * file and inspection report dossier (`#client/companies/<companyId>`).
 */
export function buildCompanyDossierUrl(
  companyId: string,
  baseUrlOverride?: string
): string {
  const cleanId = sanitizeCompanyIdSlug(companyId);
  const hash = cleanId ? `#client/companies/${cleanId}` : '#client/companies';

  if (baseUrlOverride && baseUrlOverride.trim()) {
    const cleanBase = baseUrlOverride.split('#')[0];
    return `${cleanBase}${hash}`;
  }

  if (typeof window !== 'undefined' && window.location) {
    const { origin, pathname, search } = window.location;
    if (origin && origin !== 'null') {
      return `${origin}${pathname}${search}${hash}`;
    }
  }

  return `${FALLBACK_APP_BASE}${hash}`;
}

/**
 * Generates deterministic SVG path geometry synchronously using qrcode's BitMatrix.
 * Renders cleanly at any resolution and in headless environments without Canvas.
 */
export function buildQrVectorGeometry(
  text: string,
  margin = 2
): QrVectorGeometry {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const segments: string[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (qr.modules.get(row, col)) {
        segments.push(`M${col + margin} ${row + margin}h1v1h-1z`);
      }
    }
  }

  return {
    size,
    margin,
    totalSize: size + margin * 2,
    pathData: segments.join(''),
  };
}

/**
 * Generates a PNG Data URL of the company's unique dossier QR code for download.
 */
export async function generateCompanyQrPngDataUrl(
  companyId: string,
  width = 512,
  baseUrlOverride?: string
): Promise<string> {
  const url = buildCompanyDossierUrl(companyId, baseUrlOverride);
  return QRCode.toDataURL(url, {
    width,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
}

/**
 * Renders a razor-sharp vector QR code directly into a jsPDF document
 * so report PDFs and field inspector cards scan reliably at any print scale.
 */
export function drawVectorQrOnPdf(
  doc: jsPDF,
  text: string,
  xMm: number,
  yMm: number,
  sizeMm: number,
  marginModules = 2
): void {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const total = size + marginModules * 2;
  const cell = sizeMm / total;

  // High-contrast white quiet zone
  doc.setFillColor(255, 255, 255);
  doc.rect(xMm, yMm, sizeMm, sizeMm, 'F');

  doc.setFillColor(15, 23, 42);
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (qr.modules.get(row, col)) {
        doc.rect(
          xMm + (col + marginModules) * cell,
          yMm + (row + marginModules) * cell,
          cell + 0.04,
          cell + 0.04,
          'F'
        );
      }
    }
  }
}

export type CompanyQrPassTarget = Pick<CompanyRecord, 'id'> &
  Partial<
    Pick<
      CompanyRecord,
      'companyCode' | 'nameAr' | 'nameEn' | 'sector' | 'projectLocation' | 'activeScope'
    >
  >;

/**
 * Exports a printable A4 Field Inspector Dossier Access Pass PDF containing
 * the company's unique ID, Company Code, direct dossier URL, and scannable QR.
 */
export function exportCompanyQrPassPdf(
  company: CompanyQrPassTarget,
  baseUrlOverride?: string
): string {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const dossierUrl = buildCompanyDossierUrl(company.id, baseUrlOverride);

  // Header strip
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('INSCO - FIELD INSPECTOR DOSSIER QR PASS', 14, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(
    'Scan QR Code to open live Company File & Inspection Report Dossier',
    14,
    24
  );

  // Outer card frame
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 46, 182, 134, 4, 4);

  // QR code block on right side of card
  drawVectorQrOnPdf(doc, dossierUrl, 128, 56, 58, 2);
  doc.setDrawColor(148, 163, 184);
  doc.rect(128, 56, 58, 58);

  doc.setTextColor(71, 85, 105);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('SCAN FOR LIVE DOSSIER', 157, 120, { align: 'center' });

  // Company details on left side of card
  let y = 60;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(String(company.nameEn || company.id).slice(0, 48), 22, y);
  y += 10;

  const infoRows: Array<[string, string]> = [
    ['Company ID', company.id],
    ['Company Code', company.companyCode || '-'],
    ['Sector', company.sector || '-'],
    ['Project / Site', company.projectLocation || '-'],
  ];

  doc.setFontSize(9.5);
  for (const [label, value] of infoRows) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text(`${label}:`, 22, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(String(value).slice(0, 42), 54, y);
    y += 7.5;
  }

  if (company.activeScope) {
    y += 2;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Testing Scope:', 22, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    const scopeLines = doc.splitTextToSize(company.activeScope.slice(0, 260), 96);
    doc.text(scopeLines, 22, y);
  }

  // Deep-link URL bar
  doc.setFillColor(241, 245, 249);
  doc.rect(22, 152, 164, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('DIRECT DOSSIER DEEP-LINK URL:', 26, 158);
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  doc.text(dossierUrl.slice(0, 95), 26, 165);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `INSCO Client & Inspector Access · ID ${company.id} · Generated ${new Date().toISOString().slice(0, 10)}`,
    14,
    286
  );

  const fileSlug = (company.companyCode || company.id).replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `INSCO_QR_Pass_${fileSlug}.pdf`;
  doc.save(fileName);
  return fileName;
}
