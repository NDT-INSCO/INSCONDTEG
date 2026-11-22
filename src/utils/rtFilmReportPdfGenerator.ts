import { jsPDF } from 'jspdf';
import { Language } from '../types';
import {
  AR_RT_ACCEPTANCE_CODES,
  ArRtAcceptanceCodeId,
  ArRtFilmDefectId,
  ArRtSingleCodeVerdict,
} from '../data/arRadiographyCompleteEngine';

export type RtRepairAction =
  | 'NONE'
  | 'LOCAL_GRIND_RE_RT'
  | 'CUT_OUT'
  | 'RESHOOT_FILM';

export type RtFilmDisposition =
  | 'ACCEPTED'
  | 'REJECTED_REPAIR'
  | 'RESHOOT_REQUIRED';

export interface RtFilmIndicationEntry {
  id: string;
  filmSegment: string;
  stationStartMm: number;
  stationEndMm: number;
  defectId: ArRtFilmDefectId | 'sound';
  defectNameEn: string;
  defectNameAr: string;
  lengthMm: number;
  widthMm: number;
  depthMm: number;
  countInWindow: number;
  repairAction: RtRepairAction;
  verdicts: ArRtSingleCodeVerdict[];
  notes?: string;
}

export interface RtFilmCodeAggregateSummary {
  codeId: ArRtAcceptanceCodeId;
  shortCode: string;
  clauseRef: string;
  verdict: 'ACCEPT' | 'REJECT';
  rejectingCount: number;
  maxAllowedMm: number;
  peakUtilizationPct: number;
  limitingDefectEn: string;
  limitingDefectAr: string;
  ruleFormula: string;
}

export interface RtFilmInterpretationReportData {
  reportNumber: string;
  inspectionDate: string;
  clientName: string;
  projectFacility: string;
  lineOrEquipmentTag: string;
  weldJointId: string;
  welderStamp: string;
  materialSpec: string;
  weldingProcess: string;
  wallThicknessMm: number;
  outerDiameterMm?: number;

  // Radiographic Technique & Film QC Snapshot
  sourceShortCode: string;
  energySummary: string;
  techniqueCode: string;
  sfdMm: number;
  filmClassLabel: string;
  hasLeadScreens: boolean;
  hasBackscatterB: boolean;
  iqiDesignation: string;
  iqiPlacement: 'source_side' | 'film_side';
  visibleIqiWires: number;
  requiredIqiWires: number;
  calculatedUgMm: number;
  maxAllowedUgMm: number;
  weldOpticalDensity: number;
  baseOpticalDensity: number;
  passesFilmQc: boolean;

  // Evaluation & Disposition
  governingCodeId: ArRtAcceptanceCodeId;
  governingCodeLabel: string;
  finalDisposition: RtFilmDisposition;
  indications: RtFilmIndicationEntry[];
  inspectorName: string;
  inspectorLevel: 'Level II' | 'Level III';
  inspectorCertNumber: string;
  reviewerName?: string;
  inspectorComments: string;
  signatureDataUrl?: string | null;
  language: Language;
  savedAtIso?: string;
}

export function computeAllCodesAggregateForFilm(
  indications: readonly RtFilmIndicationEntry[]
): RtFilmCodeAggregateSummary[] {
  return AR_RT_ACCEPTANCE_CODES.map((code) => {
    if (indications.length === 0) {
      return {
        codeId: code.id,
        shortCode: code.shortCode,
        clauseRef: `${code.shortCode} Standard Baseline`,
        verdict: 'ACCEPT',
        rejectingCount: 0,
        maxAllowedMm: 0,
        peakUtilizationPct: 0,
        limitingDefectEn: 'No indications logged',
        limitingDefectAr: 'لم تُسجّل مؤشرات',
        ruleFormula: 'Awaiting film indication entries',
      };
    }

    let rejectingCount = 0;
    let worstVerdict: ArRtSingleCodeVerdict | null = null;
    let worstEntry: RtFilmIndicationEntry | null = null;

    for (const entry of indications) {
      const v = entry.verdicts.find((item) => item.codeId === code.id);
      if (!v) continue;
      if (v.verdict === 'REJECT') rejectingCount += 1;

      if (!worstVerdict) {
        worstVerdict = v;
        worstEntry = entry;
      } else {
        const currentScore =
          (v.verdict === 'REJECT' ? 10000 : 0) + v.utilizationPct;
        const bestScore =
          (worstVerdict.verdict === 'REJECT' ? 10000 : 0) +
          worstVerdict.utilizationPct;
        if (currentScore > bestScore) {
          worstVerdict = v;
          worstEntry = entry;
        }
      }
    }

    return {
      codeId: code.id,
      shortCode: code.shortCode,
      clauseRef: worstVerdict?.clauseRef || code.shortCode,
      verdict: rejectingCount > 0 ? 'REJECT' : 'ACCEPT',
      rejectingCount,
      maxAllowedMm: worstVerdict?.maxAllowedMm ?? 0,
      peakUtilizationPct: worstVerdict?.utilizationPct ?? 0,
      limitingDefectEn: worstEntry?.defectNameEn || 'Sound Weld',
      limitingDefectAr: worstEntry?.defectNameAr || 'لحام سليم',
      ruleFormula: worstVerdict?.ruleFormula || code.scopeSummary.en,
    };
  });
}

function drawSectionBand(
  doc: jsPDF,
  title: string,
  x: number,
  y: number,
  width: number,
  accentColor: readonly [number, number, number] = [245, 158, 11]
) {
  doc.setFillColor(241, 245, 249);
  doc.rect(x, y, width, 5.8, 'F');
  doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
  doc.rect(x, y, 2.5, 5.8, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(title, x + 5, y + 4.1);
}

function drawKeyValueGrid(
  doc: jsPDF,
  rows: Array<Array<{ label: string; value: string; highlight?: boolean }>>,
  startX: number,
  startY: number,
  totalWidth: number
): number {
  let cursorY = startY;
  const rowHeight = 5.4;

  rows.forEach((cols) => {
    const colWidth = totalWidth / cols.length;
    cols.forEach((col, idx) => {
      const cellX = startX + idx * colWidth;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.rect(cellX, cursorY, colWidth, rowHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(100, 116, 139);
      doc.text(col.label, cellX + 1.8, cursorY + 3.6);

      const labelWidth = doc.getTextWidth(col.label) + 2.8;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.4);
      doc.setTextColor(col.highlight ? 180 : 15, col.highlight ? 83 : 23, col.highlight ? 9 : 42);
      const maxValLen = Math.max(8, Math.floor((colWidth - labelWidth - 2) / 1.55));
      const trimmed =
        col.value.length > maxValLen
          ? `${col.value.slice(0, maxValLen - 2)}..`
          : col.value;
      doc.text(trimmed, cellX + labelWidth, cursorY + 3.6);
    });
    cursorY += rowHeight;
  });

  return cursorY;
}

export function generateRtFilmInterpretationPdf(
  data: RtFilmInterpretationReportData
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const darkNavy = [15, 23, 42] as const;
  const greenAccept = [16, 185, 129] as const;
  const redReject = [225, 29, 72] as const;
  const amberReshoot = [217, 119, 6] as const;

  const statusColor =
    data.finalDisposition === 'ACCEPTED'
      ? greenAccept
      : data.finalDisposition === 'RESHOOT_REQUIRED'
      ? amberReshoot
      : redReject;
  const statusLabel =
    data.finalDisposition === 'ACCEPTED'
      ? 'ACCEPTED'
      : data.finalDisposition === 'RESHOOT_REQUIRED'
      ? 'RESHOOT'
      : 'REJECTED';

  // Header Banner
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(margin, 10, contentWidth, 23, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text('INSCO NDT & INSPECTION SERVICES CO.', margin + 5, 17.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'RADIOGRAPHIC FILM INTERPRETATION & MULTI-CODE EVALUATION REPORT (ISO 9712 / ASME SEC V)',
    margin + 5,
    23
  );
  doc.text(
    `Report No: ${data.reportNumber}  |  Date: ${data.inspectionDate}  |  Governing Code: ${data.governingCodeLabel}`,
    margin + 5,
    28.5
  );

  // Status Box
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(pageWidth - margin - 41, 13.5, 37, 15.5, 1.8, 1.8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text('FILM DISPOSITION', pageWidth - margin - 22.5, 19.2, { align: 'center' });
  doc.setFontSize(10.5);
  doc.text(statusLabel, pageWidth - margin - 22.5, 25.6, { align: 'center' });

  let cursorY = 38;

  // Section 1: Project & Specimen Metadata
  drawSectionBand(doc, '1. PROJECT, WELD JOINT & TRACEABILITY DATA', margin, cursorY, contentWidth);
  cursorY += 6.5;
  cursorY = drawKeyValueGrid(
    doc,
    [
      [
        { label: 'Client:', value: data.clientName || 'N/A' },
        { label: 'Project / Plant:', value: data.projectFacility || 'N/A' },
      ],
      [
        { label: 'Line / Equip:', value: data.lineOrEquipmentTag || 'N/A' },
        { label: 'Weld Joint ID:', value: data.weldJointId, highlight: true },
        { label: 'Welder Stamp:', value: data.welderStamp || 'W-01' },
      ],
      [
        { label: 'Material Spec:', value: data.materialSpec },
        { label: 'Process:', value: data.weldingProcess },
        {
          label: 'Geometry:',
          value: data.outerDiameterMm
            ? `OD ${data.outerDiameterMm} mm / t ${data.wallThicknessMm} mm`
            : `Plate t = ${data.wallThicknessMm} mm`,
        },
      ],
    ],
    margin,
    cursorY,
    contentWidth
  );

  cursorY += 3.5;

  // Section 2: Technique & ASME V Film Quality Control
  drawSectionBand(
    doc,
    '2. RADIOGRAPHIC TECHNIQUE & FILM QC VERIFICATION (ASME SEC V ART. 2)',
    margin,
    cursorY,
    contentWidth,
    [14, 165, 233]
  );
  cursorY += 6.5;
  cursorY = drawKeyValueGrid(
    doc,
    [
      [
        { label: 'Source / Energy:', value: `${data.sourceShortCode} (${data.energySummary})` },
        { label: 'Technique / SFD:', value: `${data.techniqueCode} @ ${data.sfdMm} mm` },
        { label: 'Film / Pb Screens:', value: `${data.filmClassLabel} (${data.hasLeadScreens ? 'Pb ON' : 'No Pb'})` },
      ],
      [
        {
          label: 'Optical Density (H&D):',
          value: `${data.weldOpticalDensity.toFixed(2)} (Base ${data.baseOpticalDensity.toFixed(2)})`,
          highlight: !data.passesFilmQc,
        },
        {
          label: 'IQI Sensitivity:',
          value: `${data.iqiDesignation} (${data.visibleIqiWires}/${data.requiredIqiWires} wires · ${data.iqiPlacement === 'source_side' ? 'Source' : 'Film'})`,
        },
        {
          label: 'Ug / Backscatter B:',
          value: `${data.calculatedUgMm.toFixed(3)} / ${data.maxAllowedUgMm.toFixed(2)} mm · ${data.hasBackscatterB ? 'B Faint OK' : 'B Check'}`,
        },
      ],
    ],
    margin,
    cursorY,
    contentWidth
  );

  cursorY += 4;

  // Section 3: Logged Film Indications Table
  drawSectionBand(
    doc,
    `3. RADIOGRAPHIC FILM INDICATIONS LOG (${data.indications.length} RECORDED)`,
    margin,
    cursorY,
    contentWidth,
    [245, 158, 11]
  );
  cursorY += 6.5;

  const colWidths = [16, 23, 46, 29, 34, 18, 20];
  const headers = ['Film Seg', 'Station (mm)', 'Indication / Flaw Type', 'Size (L x W x D)', 'Governing Clause', 'Verdict', 'Action'];

  doc.setFillColor(30, 41, 59);
  doc.rect(margin, cursorY, contentWidth, 5.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  let hx = margin;
  headers.forEach((h, i) => {
    doc.text(h, hx + 1.5, cursorY + 3.8);
    hx += colWidths[i];
  });
  cursorY += 5.5;

  if (data.indications.length === 0) {
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, cursorY, contentWidth, 6);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text('No rejectable indications recorded — weld acceptable per code baseline.', margin + 2, cursorY + 4);
    cursorY += 6;
  } else {
    data.indications.forEach((entry, idx) => {
      if (cursorY > pageHeight - 62) {
        doc.addPage();
        cursorY = 14;
      }
      const govVerdict = entry.verdicts.find((v) => v.codeId === data.governingCodeId) ?? entry.verdicts[0];
      const isReject = govVerdict?.verdict === 'REJECT';

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, cursorY, contentWidth, 5.6, 'F');
      }
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, cursorY, contentWidth, 5.6);

      const cells = [
        entry.filmSegment,
        `${entry.stationStartMm}-${entry.stationEndMm}`,
        entry.defectNameEn.slice(0, 28),
        entry.defectId === 'sound'
          ? '0.0 mm'
          : `${entry.lengthMm.toFixed(1)}x${entry.widthMm.toFixed(1)}x${entry.depthMm.toFixed(1)}`,
        (govVerdict?.clauseRef || data.governingCodeId).slice(0, 20),
        govVerdict?.verdict || 'ACCEPT',
        entry.repairAction === 'NONE'
          ? 'Accept'
          : entry.repairAction === 'LOCAL_GRIND_RE_RT'
          ? 'Grind/Re-RT'
          : entry.repairAction === 'CUT_OUT'
          ? 'Cut-Out'
          : 'Reshoot',
      ];

      let cx = margin;
      cells.forEach((val, colIdx) => {
        if (colIdx === 5) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(isReject ? 225 : 5, isReject ? 29 : 150, isReject ? 72 : 105);
        } else {
          doc.setFont('helvetica', colIdx === 2 ? 'bold' : 'normal');
          doc.setTextColor(30, 41, 59);
        }
        doc.setFontSize(6.9);
        doc.text(val, cx + 1.5, cursorY + 3.9);
        cx += colWidths[colIdx];
      });
      cursorY += 5.6;
    });
  }

  cursorY += 4;
  if (cursorY > pageHeight - 75) {
    doc.addPage();
    cursorY = 14;
  }

  // Section 4: All-7-Codes Cross-Code Compliance Matrix
  const allCodeAggregates = computeAllCodesAggregateForFilm(data.indications);
  drawSectionBand(
    doc,
    '4. CROSS-CODE ACCEPTANCE & REJECTION MATRIX (ALL 7 INTERNATIONAL STANDARDS)',
    margin,
    cursorY,
    contentWidth,
    [16, 185, 129]
  );
  cursorY += 6.5;

  const mWidths = [34, 42, 20, 22, 68];
  const mHeaders = ['Code / Standard', 'Clause Reference', 'Verdict', 'Max Limit', 'Limiting Formula / Criterion'];
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, cursorY, contentWidth, 5.2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.9);
  let mx = margin;
  mHeaders.forEach((h, idx) => {
    doc.text(h, mx + 1.5, cursorY + 3.6);
    mx += mWidths[idx];
  });
  cursorY += 5.2;

  allCodeAggregates.forEach((row, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, cursorY, contentWidth, 5.2, 'F');
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, cursorY, contentWidth, 5.2);

    const isGov = row.codeId === data.governingCodeId;
    const isRej = row.verdict === 'REJECT';
    const rowCells = [
      `${row.shortCode}${isGov ? ' *' : ''}`,
      row.clauseRef.slice(0, 25),
      row.verdict,
      row.maxAllowedMm > 0 ? `${row.maxAllowedMm.toFixed(1)} mm` : '0 mm (Zero)',
      row.ruleFormula.slice(0, 46),
    ];

    let rx = margin;
    rowCells.forEach((txt, cIdx) => {
      if (cIdx === 2) {
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(isRej ? 225 : 5, isRej ? 29 : 150, isRej ? 72 : 105);
      } else {
        doc.setFont('helvetica', cIdx === 0 && isGov ? 'bold' : 'normal');
        doc.setTextColor(30, 41, 59);
      }
      doc.setFontSize(6.8);
      doc.text(txt, rx + 1.5, cursorY + 3.6);
      rx += mWidths[cIdx];
    });
    cursorY += 5.2;
  });

  cursorY += 4.5;
  if (cursorY > pageHeight - 44) {
    doc.addPage();
    cursorY = 14;
  }

  // Section 5: Comments & Digital Sign-Off
  drawSectionBand(
    doc,
    '5. INSPECTOR REMARKS, CERTIFICATION & DIGITAL SIGN-OFF',
    margin,
    cursorY,
    contentWidth,
    [100, 116, 139]
  );
  cursorY += 6.5;

  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, cursorY, contentWidth, 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(51, 65, 85);
  const commentLines = doc.splitTextToSize(
    data.inspectorComments || 'Film quality verified per ASME Sec V Art. 2 and evaluated across governing acceptance standard.',
    contentWidth - 62
  );
  doc.text(commentLines.slice(0, 4), margin + 2.5, cursorY + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Inspector: ${data.inspectorName} (${data.inspectorLevel}) · Cert: ${data.inspectorCertNumber}`,
    margin + 2.5,
    cursorY + 21.5
  );
  if (data.reviewerName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Level III / Client Reviewer: ${data.reviewerName}`, margin + 2.5, cursorY + 24.7);
  }

  // Signature box on right
  const sigBoxX = pageWidth - margin - 54;
  doc.setDrawColor(203, 213, 225);
  doc.rect(sigBoxX, cursorY + 1.5, 51, 22.5);
  if (data.signatureDataUrl && data.signatureDataUrl.startsWith('data:image/')) {
    try {
      doc.addImage(data.signatureDataUrl, 'PNG', sigBoxX + 2, cursorY + 2.5, 47, 16);
    } catch {
      // Fallback if mock canvas image cannot be decoded in headless tests
    }
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Digital Signature', sigBoxX + 25.5, cursorY + 22.5, { align: 'center' });

  // Footer
  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated by Radiographic Film Reading & Multi-Code Workbench · ${data.reportNumber} · * Denotes Active Governing Code`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  return doc;
}

export function buildRtFilmReportCsv(data: RtFilmInterpretationReportData): string {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const codeOrder: ArRtAcceptanceCodeId[] = [
    'ASME_VIII_UW51',
    'ASME_VIII_UW52',
    'ASME_B31_3_NORMAL',
    'ASME_B31_1',
    'API_1104',
    'AWS_D1_1',
    'ISO_10675_1_B',
  ];

  const lines: string[] = [];
  lines.push(
    [
      'ReportNumber',
      'InspectionDate',
      'Client',
      'Facility',
      'WeldJointId',
      'ThicknessMm',
      'GoverningCode',
      'FinalDisposition',
      'FilmSegment',
      'StationMm',
      'DefectId',
      'DefectName',
      'LengthMm',
      'WidthMm',
      'DepthMm',
      'RepairAction',
      ...codeOrder,
    ]
      .map(escapeCell)
      .join(',')
  );

  const rows =
    data.indications.length > 0
      ? data.indications
      : [
          {
            id: 'sound-baseline',
            filmSegment: '0-1',
            stationStartMm: 0,
            stationEndMm: 250,
            defectId: 'sound' as const,
            defectNameEn: 'Sound Weld (No Rejectable Indications)',
            defectNameAr: 'لحام سليم',
            lengthMm: 0,
            widthMm: 0,
            depthMm: 0,
            countInWindow: 0,
            repairAction: 'NONE' as const,
            verdicts: [],
          },
        ];

  for (const ind of rows) {
    const perCodeCols = codeOrder.map((cid) => {
      const match = ind.verdicts.find((v) => v.codeId === cid);
      return match ? `${match.verdict} (Max ${match.maxAllowedMm}mm)` : 'ACCEPT';
    });
    lines.push(
      [
        data.reportNumber,
        data.inspectionDate,
        data.clientName,
        data.projectFacility,
        data.weldJointId,
        data.wallThicknessMm,
        data.governingCodeId,
        data.finalDisposition,
        ind.filmSegment,
        `${ind.stationStartMm}-${ind.stationEndMm}`,
        ind.defectId,
        ind.defectNameEn,
        ind.lengthMm,
        ind.widthMm,
        ind.depthMm,
        ind.repairAction,
        ...perCodeCols,
      ]
        .map(escapeCell)
        .join(',')
    );
  }

  return `\uFEFF${lines.join('\n')}`;
}
