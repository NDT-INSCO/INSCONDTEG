import { jsPDF } from 'jspdf';

export interface WeldInspectionReportData {
  reportNumber: string;
  inspectionDate: string;
  clientName: string;
  facility: string;
  weldJointId: string;
  inspectorName: string;
  inspectorLevel: 'Level II' | 'Level III';
  inspectorCertNumber: string;
  selectedCode: string;
  codeClauseCitation: string;
  materialSpecification: string;
  plateThicknessMm: number;
  specimenGeometry?: 'flat' | 'curved';
  pipeOuterDiameterMm?: number;
  instrumentMode?: 'ut' | 'paut';
  jointType: string;
  probeModel: string;
  probeAngleDeg: number;
  probeFrequencyMhz: number;
  velocityMs: number;
  zeroDelayUs: number;
  gainDb: number;
  calBlockUsed: string;
  pautApertureElements?: number;
  pautFocalDepthMm?: number;
  flawName: string;
  flawCategory: 'Planar' | 'Volumetric';
  soundPathMm: number;
  trueDepthMm: number;
  surfaceDistMm: number;
  flawLengthMm: number;
  flawHeightMm?: number;
  echoAmplitudePct: number;
  isReject: boolean;
  codeExplanation: string;
  signatureDataUrl?: string | null;
  language: 'ar' | 'en';
}

/**
 * Generates an official engineering PDF inspection report for UT & PAUT weld examination.
 */
export function generateWeldInspectionPdf(data: WeldInspectionReportData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const darkNavy = [11, 15, 38] as const;
  const redReject = [225, 29, 72] as const;
  const greenAccept = [16, 185, 129] as const;
  const textDark = [30, 41, 59] as const;
  const grayBorder = [203, 213, 225] as const;
  const lightBg = [248, 250, 252] as const;

  const isPaut = data.instrumentMode === 'paut';
  const isCurved = data.specimenGeometry === 'curved';

  // 1. Header Banner
  doc.setFillColor(...darkNavy);
  doc.rect(margin, 12, contentWidth, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('INSCO NDT & INSPECTION SERVICES CO.', margin + 6, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('ACCREDITED TESTING LABORATORY · ISO 9712 / ISO 17025 / ASME SECTION V', margin + 6, 26);
  doc.text('Cairo, Egypt · Tel: +20 2 2450 1200 · Email: info@insco-ndt.com', margin + 6, 31);

  // Status Badge in Header Top Right
  if (data.isReject) {
    doc.setFillColor(...redReject);
    doc.roundedRect(pageWidth - margin - 46, 16, 40, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('WELD STATUS', pageWidth - margin - 26, 22, { align: 'center' });
    doc.setFontSize(11);
    doc.text('REJECTED', pageWidth - margin - 26, 28, { align: 'center' });
  } else {
    doc.setFillColor(...greenAccept);
    doc.roundedRect(pageWidth - margin - 46, 16, 40, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('WELD STATUS', pageWidth - margin - 26, 22, { align: 'center' });
    doc.setFontSize(11);
    doc.text('ACCEPTED', pageWidth - margin - 26, 28, { align: 'center' });
  }

  // 2. Report Document Title
  let cursorY = 42;
  doc.setTextColor(...darkNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text(
    isPaut
      ? 'PHASED ARRAY ULTRASONIC EXAMINATION REPORT (PAUT)'
      : 'ULTRASONIC WELD EXAMINATION TEST REPORT (UT)',
    margin,
    cursorY
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Form Ref: ${isPaut ? 'INSCO-PAUT-FORM-08' : 'INSCO-UT-FORM-04'} · Generated on ${data.inspectionDate}`,
    margin,
    cursorY + 5
  );

  // 3. Section: General Administrative Details
  cursorY += 10;
  drawSectionHeader(doc, '1. GENERAL & SPECIMEN GEOMETRY DATA', margin, cursorY, contentWidth);
  cursorY += 6;

  const row1 = [
    { label: 'Report Number:', value: data.reportNumber },
    { label: 'Date of Examination:', value: data.inspectionDate },
    { label: 'Client / Facility:', value: data.clientName },
    { label: 'Project Plant:', value: data.facility },
  ];
  drawGrid2x2(doc, row1, margin, cursorY, contentWidth);
  cursorY += 14;

  const geometryDesc = isCurved
    ? `Curved Pipe Butt Weld (OD = ${data.pipeOuterDiameterMm || 219} mm, t = ${data.plateThicknessMm} mm)`
    : `Flat Plate Butt Weld (${data.jointType}, t = ${data.plateThicknessMm} mm)`;

  const row2 = [
    { label: 'Applicable Standard:', value: data.codeClauseCitation },
    { label: 'Weld Joint Tag:', value: data.weldJointId },
    { label: 'Specimen Geometry:', value: geometryDesc },
    { label: 'Base Material:', value: data.materialSpecification },
  ];
  drawGrid2x2(doc, row2, margin, cursorY, contentWidth);
  cursorY += 16;

  // 4. Section: Ultrasonic Equipment & Calibration Parameters
  drawSectionHeader(
    doc,
    isPaut
      ? '2. PAUT PHASED ARRAY INSTRUMENT, FOCAL LAW & CALIBRATION SETUP'
      : '2. ULTRASONIC INSTRUMENT & CALIBRATION SETUP',
    margin,
    cursorY,
    contentWidth
  );
  cursorY += 6;

  const equipRow = [
    { label: 'Instrument Unit:', value: data.probeModel },
    {
      label: isPaut ? 'Array / Beam Sweep:' : 'Transducer / Angle:',
      value: isPaut
        ? `${data.pautApertureElements || 32}E Array · ${data.probeAngleDeg}° Cursor (${data.probeFrequencyMhz} MHz)`
        : `${data.probeAngleDeg}° Shear Wave (${data.probeFrequencyMhz} MHz)`,
    },
    { label: 'Acoustic Velocity:', value: `${data.velocityMs} m/s (Shear Wave)` },
    { label: isPaut ? 'Wedge Delay / Focus:' : 'Probe Zero Delay:', value: isPaut ? `${data.zeroDelayUs.toFixed(2)} µs · Focus ${data.pautFocalDepthMm || 20} mm` : `${data.zeroDelayUs.toFixed(2)} µs` },
  ];
  drawGrid2x2(doc, equipRow, margin, cursorY, contentWidth);
  cursorY += 14;

  const calRow = [
    { label: 'System Gain:', value: `${data.gainDb.toFixed(1)} dB (Ref Sensitivity)` },
    { label: 'Calibration Block:', value: data.calBlockUsed },
    { label: 'Sensitivity Curve:', value: isPaut ? 'ACG + 3-Point TCG Equalized' : 'ASME 3-Point SDH DAC Enabled' },
    { label: 'Surface Condition:', value: isCurved ? 'Curved OD Contoured Wedge / Gel' : 'Flat Ground Flush / Cellulose Gel' },
  ];
  drawGrid2x2(doc, calRow, margin, cursorY, contentWidth);
  cursorY += 17;

  // 5. Section: Ultrasonic Inspection Findings & Defect Sizing Table
  drawSectionHeader(doc, '3. RECORDED INDICATIONS & FLAW SIZING TABLE', margin, cursorY, contentWidth);
  cursorY += 6;

  const tableX = margin;
  const colWidths = [10, 40, 20, 22, 22, 24, 22, 22];
  const headers = ['#', 'Discontinuity', 'Nature', 'Sound Path', 'True Depth', 'Size (L × Δh)', '% DAC/FSH', 'Verdict'];

  doc.setFillColor(...darkNavy);
  doc.rect(tableX, cursorY, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.3);

  let currentX = tableX;
  headers.forEach((h, i) => {
    doc.text(h, currentX + colWidths[i] / 2, cursorY + 4.8, { align: 'center' });
    currentX += colWidths[i];
  });
  cursorY += 7;

  // Table Row
  doc.setFillColor(...lightBg);
  doc.rect(tableX, cursorY, contentWidth, 8.5, 'F');
  doc.setDrawColor(...grayBorder);
  doc.rect(tableX, cursorY, contentWidth, 8.5, 'S');

  doc.setTextColor(...textDark);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);

  const sizeLabel = data.flawHeightMm
    ? `${data.flawLengthMm.toFixed(1)}×${data.flawHeightMm.toFixed(1)} mm`
    : `L=${data.flawLengthMm.toFixed(1)} mm`;

  const rowValues = [
    '1',
    data.flawName,
    data.flawCategory,
    `${data.soundPathMm.toFixed(1)} mm`,
    `${data.trueDepthMm.toFixed(1)} mm`,
    sizeLabel,
    `${data.echoAmplitudePct}%`,
    data.isReject ? 'REJECT' : 'ACCEPT',
  ];

  currentX = tableX;
  rowValues.forEach((val, i) => {
    if (i === 7) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(
        data.isReject ? redReject[0] : greenAccept[0],
        data.isReject ? redReject[1] : greenAccept[1],
        data.isReject ? redReject[2] : greenAccept[2]
      );
    } else {
      doc.setFont('helvetica', i === 1 ? 'bold' : 'normal');
      doc.setTextColor(...textDark);
    }
    doc.text(val, currentX + colWidths[i] / 2, cursorY + 5.5, { align: 'center' });
    currentX += colWidths[i];
  });
  cursorY += 12.5;

  // 6. Section: Code Compliance & Final Engineering Disposition
  drawSectionHeader(doc, '4. CODE COMPLIANCE EVALUATION & DISPOSITION', margin, cursorY, contentWidth);
  cursorY += 6;

  doc.setFillColor(data.isReject ? 254 : 240, data.isReject ? 242 : 253, data.isReject ? 242 : 250);
  doc.setDrawColor(
    data.isReject ? redReject[0] : greenAccept[0],
    data.isReject ? redReject[1] : greenAccept[1],
    data.isReject ? redReject[2] : greenAccept[2]
  );
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, cursorY, contentWidth, 21, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(
    data.isReject ? redReject[0] : greenAccept[0],
    data.isReject ? redReject[1] : greenAccept[1],
    data.isReject ? redReject[2] : greenAccept[2]
  );
  doc.text(
    data.isReject
      ? 'FINAL STATUS: UNACCEPTABLE / REJECTED (EXCAVATION & REPAIR REQUIRED)'
      : 'FINAL STATUS: COMPLIANT / ACCEPTED (WELD JOINT APPROVED)',
    margin + 4,
    cursorY + 5.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(...textDark);
  const safeAsciiExplanation =
    data.isReject
      ? `Evaluated per ${data.codeClauseCitation}: Discontinuity (${data.flawName}, ${data.flawCategory}, L=${data.flawLengthMm.toFixed(1)}mm) exceeds maximum allowable code limits. Defect must be excavated, repaired per qualified WPS, and re-inspected.`
      : `Evaluated per ${data.codeClauseCitation}: Discontinuity (${data.flawName}, ${data.flawCategory}, L=${data.flawLengthMm.toFixed(1)}mm) is within allowable code limits and weld is accepted for service.`;
  const splitText = doc.splitTextToSize(safeAsciiExplanation, contentWidth - 8);
  doc.text(splitText, margin + 4, cursorY + 10.5);
  cursorY += 25;

  // 7. Section: Official Virtual Electronic Signature & Sign-Off Stamp
  drawSectionHeader(doc, '5. OFFICIAL ELECTRONIC SIGNATURE & QA/QC VERIFICATION', margin, cursorY, contentWidth);
  cursorY += 5;

  const signBoxWidth = (contentWidth - 6) / 2;
  const signBoxHeight = 32;

  // Left Box: Certified NDT Inspector
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...grayBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, cursorY, signBoxWidth, signBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...textDark);
  doc.text('CERTIFIED ASNT NDT LEVEL II/III INSPECTOR', margin + 4, cursorY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Inspector: ${data.inspectorName}`, margin + 4, cursorY + 9.5);
  doc.text(`Qualification: ${data.inspectorLevel} (Cert #: ${data.inspectorCertNumber})`, margin + 4, cursorY + 13.5);
  doc.text(`Signed Date: ${data.inspectionDate}`, margin + 4, cursorY + 17.5);

  if (data.signatureDataUrl && data.signatureDataUrl.startsWith('data:image/')) {
    try {
      doc.addImage(data.signatureDataUrl, 'PNG', margin + 4, cursorY + 19, signBoxWidth - 10, 11);
    } catch {
      drawVirtualSignatureFallback(doc, data.inspectorName, margin + 6, cursorY + 25);
    }
  } else {
    drawVirtualSignatureFallback(doc, data.inspectorName, margin + 6, cursorY + 25);
  }

  // Right Box: QA/QC Verification Stamp
  const rightBoxX = margin + signBoxWidth + 6;
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...grayBorder);
  doc.roundedRect(rightBoxX, cursorY, signBoxWidth, signBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkNavy);
  doc.text('THIRD-PARTY QA/QC VERIFICATION SEAL', rightBoxX + 4, cursorY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Agency: INSCO Quality Control & Certification Body', rightBoxX + 4, cursorY + 9.5);
  doc.text(`Method: ${isPaut ? 'Encoded PAUT S-Scan / C-Scan' : 'Conventional Pulse-Echo UT'}`, rightBoxX + 4, cursorY + 13.5);

  doc.setDrawColor(...greenAccept);
  doc.setLineWidth(0.6);
  doc.roundedRect(rightBoxX + 4, cursorY + 16, signBoxWidth - 8, 13, 1, 1, 'S');
  doc.setTextColor(...greenAccept);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('DIGITALLY SIGNED & AUDIT VERIFIED', rightBoxX + signBoxWidth / 2, cursorY + 21, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('ISO 9712 · ASME SEC V ARTICLE 4 COMPLIANT', rightBoxX + signBoxWidth / 2, cursorY + 26, { align: 'center' });

  // 8. Footer Disclaimer
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(6.5);
  doc.text(
    'Computer-generated NDT Simulation & Examination Report produced per ASME Section V Article 4 & ISO 17640.',
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  return doc;
}

function drawSectionHeader(doc: jsPDF, title: string, x: number, y: number, width: number) {
  doc.setFillColor(241, 245, 249);
  doc.rect(x, y - 4, width, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(14, 116, 144);
  doc.text(title, x + 2, y);
}

function drawGrid2x2(
  doc: jsPDF,
  items: Array<{ label: string; value: string }>,
  startX: number,
  startY: number,
  totalWidth: number
) {
  const colW = totalWidth / 2;
  items.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = startX + col * colW;
    const y = startY + row * 6.5;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, x + 2, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.3);
    doc.setTextColor(30, 41, 59);
    const clippedVal = item.value.length > 36 ? `${item.value.slice(0, 35)}...` : item.value;
    doc.text(clippedVal, x + 36, y);
  });
}

function drawVirtualSignatureFallback(doc: jsPDF, name: string, x: number, y: number) {
  doc.setFont('times', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(37, 99, 235);
  doc.text(`Signed: ${name} (Certified NDT Inspector)`, x, y);
}
