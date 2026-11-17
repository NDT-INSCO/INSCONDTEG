import { jsPDF } from 'jspdf';
import {
  GeSourceType,
  GeFilmId,
  GeMaterialId,
  GeTechniqueGeometry,
  GeFilmLoadingMode,
  GeWideLatitudeGoverning,
  GeIsotopeSpec,
  GeFilmSpec,
  GeMaterialSpec,
  GeTechniqueSpec,
  GE_ISOTOPES,
  GE_STRUCTURIX_FILMS,
  GE_MATERIALS,
  GE_TECHNIQUES
} from './geExposureTimeEngine';

export interface GeRadiographicPdfReportData {
  reportNumber: string;
  reportDate: string;
  clientName?: string;
  projectFacility?: string;
  weldJointId?: string;
  leadRadiographer?: string;
  radiographerLevel?: 'Level I' | 'Level II' | 'Level III';
  inspectorCertNumber?: string;

  // Radiation Source
  sourceType: GeSourceType;
  isotopeSpec: GeIsotopeSpec;
  initialActivityCi: number;
  initialCalibrationDate: string;
  measurementDate: string;
  decayDaysElapsed: number;
  currentLiveActivityCi: number;
  tubeKv?: number;
  tubeMa?: number;

  // Material & Geometry
  materialSpec: GeMaterialSpec;
  nominalThicknessMm: number;
  weldReinforcementMm: number;
  pipeOuterDiameterMm?: number;
  techniqueSpec: GeTechniqueSpec;
  sfdCm: number;

  // Film & Quality
  filmLoadingMode: GeFilmLoadingMode;
  primaryFilmSpec: GeFilmSpec;
  secondaryFilmSpec?: GeFilmSpec;
  hasInterleafLeadScreen?: boolean;
  wideLatitudeGoverning?: GeWideLatitudeGoverning;
  hasLeadScreens: boolean;
  hasCollimator: boolean;
  targetOpticalDensity: number;

  // Calculated Results
  calculatedExposureSeconds: number;
  formattedExposureDuration: string;
  exposureInCurieMinutes: number;
  effectiveSteelThicknessMm: number;
  halfValueLayersCount: number;
  attenuationFactor: number;
  calculatedUgMm: number;
  maxAllowedUgMm: number;
  passesAsmeUg: boolean;
  essentialWireIdentity: string;
  essentialWireDiameterMm: number;
  iqiSetDesignation: string;
  controlledAreaPerimeter2mR_Meters: number;
  publicBarricadePerimeter075mR_Meters: number;

  // Multi-film specifics
  isMultiFilm: boolean;
  film1PredictedDensity: number;
  film2PredictedDensity?: number;
  compositeSuperimposedDensity?: number;
  multiFilmTimeFactor: number;
  speedRatioDescription?: string;

  notes?: string;
}

/**
 * Helper to draw section header bands
 */
function drawSectionHeader(
  doc: jsPDF,
  title: string,
  x: number,
  y: number,
  width: number,
  accentColor: readonly [number, number, number] = [245, 158, 11]
) {
  doc.setFillColor(241, 245, 249);
  doc.rect(x, y, width, 5.5, 'F');
  doc.setFillColor(...accentColor);
  doc.rect(x, y, 2.5, 5.5, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(title, x + 5, y + 4);
}

/**
 * Helper to draw a 2-column or 4-column key-value grid
 */
function drawKeyValueRow(
  doc: jsPDF,
  items: Array<{ label: string; value: string; isBold?: boolean; isHighlight?: boolean }>,
  startX: number,
  startY: number,
  totalWidth: number,
  rowHeight: number = 5.2
) {
  const colWidth = totalWidth / items.length;

  items.forEach((item, index) => {
    const colX = startX + index * colWidth;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label, colX, startY + 3.2);

    const labelWidth = doc.getTextWidth(item.label);
    const valueX = colX + Math.max(labelWidth + 2, 28);

    doc.setFont('helvetica', item.isBold ? 'bold' : 'normal');
    doc.setFontSize(7.2);

    if (item.isHighlight) {
      doc.setTextColor(180, 83, 9); // Amber
    } else {
      doc.setTextColor(15, 23, 42);
    }

    // Truncate if too long
    const availableWidth = colWidth - Math.max(labelWidth + 2, 28) - 1;
    let valText = item.value;
    if (doc.getTextWidth(valText) > availableWidth) {
      while (valText.length > 4 && doc.getTextWidth(valText + '...') > availableWidth) {
        valText = valText.slice(0, -1);
      }
      valText += '...';
    }

    doc.text(valText, valueX, startY + 3.2);
  });
}

/**
 * Generates an engineering-grade PDF report of GE Radiographic Exposure calculations.
 */
export function generateGeRadiographicExposurePdf(data: GeRadiographicPdfReportData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const brandNavy = [15, 23, 42] as const;
  const amberAccent = [245, 158, 11] as const;
  const emeraldPass = [16, 185, 129] as const;
  const crimsonAlert = [225, 29, 72] as const;
  const slateBorder = [226, 232, 240] as const;

  // -------------------------------------------------------------------------
  // 1. TOP HEADER BANNER
  // -------------------------------------------------------------------------
  doc.setFillColor(...brandNavy);
  doc.rect(margin, 10, contentWidth, 23, 'F');

  // Decorative amber bar on top
  doc.setFillColor(...amberAccent);
  doc.rect(margin, 10, contentWidth, 1.8, 'F');

  // Company and Division Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('INSCO NDT & INSPECTION SERVICES CO.', margin + 5, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(203, 213, 225);
  doc.text('INDUSTRIAL RADIOGRAPHY DIVISION · NON-DESTRUCTIVE EXAMINATION', margin + 5, 23);
  doc.text('ACCREDITED TESTING LABORATORY · ASME SECTION V · ISO 9712 · EN ISO 17636', margin + 5, 28);

  // Status Badge (ASME Section V Ug Compliance)
  const badgeWidth = 42;
  const badgeX = pageWidth - margin - badgeWidth - 4;
  if (data.passesAsmeUg) {
    doc.setFillColor(...emeraldPass);
    doc.roundedRect(badgeX, 15, badgeWidth, 13, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('ASME SEC V COMPLIANT', badgeX + badgeWidth / 2, 20.5, { align: 'center' });
    doc.setFontSize(8.5);
    doc.text(`Ug = ${data.calculatedUgMm} mm (PASS)`, badgeX + badgeWidth / 2, 25.5, { align: 'center' });
  } else {
    doc.setFillColor(...crimsonAlert);
    doc.roundedRect(badgeX, 15, badgeWidth, 13, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('ASME SEC V REVIEW', badgeX + badgeWidth / 2, 20.5, { align: 'center' });
    doc.setFontSize(8.5);
    doc.text(`Ug = ${data.calculatedUgMm} mm (> MAX)`, badgeX + badgeWidth / 2, 25.5, { align: 'center' });
  }

  // -------------------------------------------------------------------------
  // 2. DOCUMENT TITLE & IDENTIFICATION STRIP
  // -------------------------------------------------------------------------
  let cursorY = 38;
  doc.setTextColor(...brandNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GE / WAYGATE RADIOGRAPHIC EXPOSURE TECHNIQUE & CALCULATION REPORT', margin, cursorY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Doc Ref: INSCO-RT-EXP-2026 / ASME Sec V Art 2 · Agfa Structurix Curves · Generated on ${data.reportDate}`,
    margin,
    cursorY + 4.5
  );

  // -------------------------------------------------------------------------
  // 3. SECTION 1: GENERAL JOB, WELD & COMPONENT GEOMETRY
  // -------------------------------------------------------------------------
  cursorY += 9;
  drawSectionHeader(doc, '1. ADMINISTRATIVE & COMPONENT GEOMETRY SPECIFICATION', margin, cursorY, contentWidth);
  cursorY += 7;

  drawKeyValueRow(
    doc,
    [
      { label: 'Report No.:', value: data.reportNumber, isBold: true },
      { label: 'Inspection Date:', value: data.reportDate },
      { label: 'Client Name:', value: data.clientName || 'INSCO Industrial NDT Client' },
    ],
    margin,
    cursorY,
    contentWidth
  );
  cursorY += 6;

  drawKeyValueRow(
    doc,
    [
      { label: 'Plant / Facility:', value: data.projectFacility || 'Petrochemical Complex / Field Site' },
      { label: 'Weld Joint ID:', value: data.weldJointId || 'W-01 / Circumferential Butt' },
      { label: 'Applicable Code:', value: 'ASME Sec V Art 2 / Sec VIII Div 1', isBold: true },
    ],
    margin,
    cursorY,
    contentWidth
  );
  cursorY += 6;

  const geomDetail = data.pipeOuterDiameterMm
    ? `Pipe OD ${data.pipeOuterDiameterMm} mm (${(data.pipeOuterDiameterMm / 25.4).toFixed(2)}") [t=${data.nominalThicknessMm} mm / ${(data.nominalThicknessMm / 25.4).toFixed(3)}"]`
    : `Flat Plate [t=${data.nominalThicknessMm} mm / ${(data.nominalThicknessMm / 25.4).toFixed(3)}"]`;

  drawKeyValueRow(
    doc,
    [
      { label: 'Base Material:', value: `${data.materialSpec.nameEn.split('/')[0]} (R=${data.materialSpec.rFactorIr192})` },
      { label: 'Geometry:', value: geomDetail },
      { label: 'Weld Reinforcement:', value: `+${data.weldReinforcementMm} mm (${(data.weldReinforcementMm / 25.4).toFixed(3)}")` },
    ],
    margin,
    cursorY,
    contentWidth
  );
  cursorY += 6;

  drawKeyValueRow(
    doc,
    [
      { label: 'Shooting Geometry:', value: data.techniqueSpec.nameEn.split('—')[0].trim(), isBold: true },
      { label: 'Walls Penetrated:', value: `${data.techniqueSpec.wallsPenetrated} Wall(s)` },
      { label: 'SFD / FFD Distance:', value: `${data.sfdCm} cm (${Math.round(data.sfdCm / 2.54)} in / ${(data.sfdCm / 30.48).toFixed(2)} ft)`, isHighlight: true, isBold: true },
    ],
    margin,
    cursorY,
    contentWidth
  );

  // -------------------------------------------------------------------------
  // 4. SECTION 2: RADIATION SOURCE & ISOTOPE DECAY PHYSICS
  // -------------------------------------------------------------------------
  cursorY += 9;
  drawSectionHeader(doc, '2. RADIATION SOURCE, DECAY METRICS & ATTENUATION', margin, cursorY, contentWidth);
  cursorY += 7;

  const isGamma = data.isotopeSpec.category === 'gamma';

  if (isGamma) {
    drawKeyValueRow(
      doc,
      [
        { label: 'Radiation Source:', value: data.isotopeSpec.nameEn, isBold: true },
        { label: 'Isotope Half-Life:', value: `${data.isotopeSpec.halfLifeDays} Days (T1/2)` },
        { label: 'Focal Spot Size:', value: `${data.isotopeSpec.focalSpotMm} mm` },
      ],
      margin,
      cursorY,
      contentWidth
    );
    cursorY += 6;

    drawKeyValueRow(
      doc,
      [
        { label: 'Initial Activity (A0):', value: `${data.initialActivityCi} Ci (${data.initialCalibrationDate})` },
        { label: 'Elapsed Decay:', value: `${data.decayDaysElapsed} Days` },
        {
          label: 'Live Current Activity:',
          value: `${data.currentLiveActivityCi} Ci (Active At Shot)`,
          isBold: true,
          isHighlight: true,
        },
      ],
      margin,
      cursorY,
      contentWidth
    );
    cursorY += 6;
  } else {
    drawKeyValueRow(
      doc,
      [
        { label: 'Radiation Source:', value: data.isotopeSpec.nameEn, isBold: true },
        { label: 'Tube Voltage:', value: `${data.tubeKv || 200} kV (Constant Potential)`, isBold: true },
        { label: 'Tube Current:', value: `${data.tubeMa || 4.0} mA`, isHighlight: true, isBold: true },
      ],
      margin,
      cursorY,
      contentWidth
    );
    cursorY += 6;
  }

  drawKeyValueRow(
    doc,
    [
      { label: 'Effective Steel Thick:', value: `${data.effectiveSteelThicknessMm} mm Equivalent`, isBold: true },
      { label: 'Steel HVL / TVL:', value: `${data.isotopeSpec.steelHvlMm} mm / ${(data.isotopeSpec.steelHvlMm * 3.32).toFixed(1)} mm` },
      { label: 'Penetration Attenuation:', value: `${data.halfValueLayersCount} HVL (Factor: x${data.attenuationFactor})` },
    ],
    margin,
    cursorY,
    contentWidth
  );

  // -------------------------------------------------------------------------
  // 5. SECTION 3: FILM SYSTEM, MULTI-FILM ARRANGEMENT & QUALITY CONTROLS
  // -------------------------------------------------------------------------
  cursorY += 9;
  drawSectionHeader(doc, '3. AGFA STRUCTURIX FILM SYSTEM & MULTI-FILM ARRANGEMENT', margin, cursorY, contentWidth);
  cursorY += 7;

  let loadingModeLabel = 'Single Film (Standard Single Layer)';
  if (data.filmLoadingMode === 'dual_composite') {
    loadingModeLabel = 'Dual Composite Superimposed (ASME Sec V T-282.1)';
  } else if (data.filmLoadingMode === 'dual_different') {
    loadingModeLabel = 'Dual Different Wide-Latitude Combination';
  }

  drawKeyValueRow(
    doc,
    [
      { label: 'Film Loading Mode:', value: loadingModeLabel, isBold: true },
      { label: 'Primary Film (Front):', value: `${data.primaryFilmSpec.code} (${data.primaryFilmSpec.astmClass})`, isBold: true },
      {
        label: 'Secondary Film (Back):',
        value: data.secondaryFilmSpec
          ? `${data.secondaryFilmSpec.code} (${data.secondaryFilmSpec.astmClass})`
          : 'N/A (Single)',
      },
    ],
    margin,
    cursorY,
    contentWidth
  );
  cursorY += 6;

  drawKeyValueRow(
    doc,
    [
      {
        label: 'Interleaf Screen:',
        value: data.hasInterleafLeadScreen ? '0.025 mm Pb Foil (Between Films)' : 'None',
        isBold: !!data.hasInterleafLeadScreen,
      },
      {
        label: 'Intensifying Screens:',
        value: data.hasLeadScreens ? 'Front 0.125 mm / Back 0.25 mm Pb' : 'None',
      },
      {
        label: 'Tungsten Collimator:',
        value: data.hasCollimator ? 'Active (Shielded Directional)' : 'Open Beam',
      },
    ],
    margin,
    cursorY,
    contentWidth
  );
  cursorY += 6;

  drawKeyValueRow(
    doc,
    [
      { label: 'Target Optical Density:', value: `${data.targetOpticalDensity.toFixed(1)} H&D (ASME 2.0-4.0)`, isHighlight: true, isBold: true },
      {
        label: 'Multi-Film Factor:',
        value: data.isMultiFilm ? `x${data.multiFilmTimeFactor} (${data.multiFilmTimeFactor < 1 ? '-45% Time' : 'Governed'})` : '1.0x (Standard)',
        isBold: true,
      },
      {
        label: 'Governing Strategy:',
        value: data.wideLatitudeGoverning === 'secondary_film' ? 'Secondary Film' : data.wideLatitudeGoverning === 'balanced_latitude' ? 'Balanced Mean' : 'Primary Film',
      },
    ],
    margin,
    cursorY,
    contentWidth
  );

  // -------------------------------------------------------------------------
  // 6. SECTION 4: PRIMARY RADIOGRAPHIC RESULTS (HIGHLIGHT BOX)
  // -------------------------------------------------------------------------
  cursorY += 9;
  drawSectionHeader(doc, '4. CALCULATED EXPOSURE RESULTS & QUALITY VERIFICATION', margin, cursorY, contentWidth);
  cursorY += 6;

  // Prominent Results Container Box
  doc.setFillColor(254, 243, 199); // Soft amber light bg
  doc.roundedRect(margin, cursorY, contentWidth, 23, 2, 2, 'F');
  doc.setDrawColor(...amberAccent);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, cursorY, contentWidth, 23, 2, 2, 'S');

  // Big Exposure Time
  doc.setTextColor(180, 83, 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CALCULATED TOTAL EXPOSURE TIME:', margin + 5, cursorY + 6);

  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42);
  doc.text(data.formattedExposureDuration, margin + 5, cursorY + 15);

  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9);
  doc.text(`(${data.calculatedExposureSeconds} Seconds)`, margin + 50, cursorY + 15);

  // Dose & Multi-film savings
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const doseLabel = isGamma
    ? `Dose: ${data.exposureInCurieMinutes} Ci·min (at ${data.currentLiveActivityCi} Ci)`
    : `Dose: ${data.exposureInCurieMinutes} mA·min (at ${data.tubeMa} mA)`;
  doc.text(doseLabel, margin + 5, cursorY + 20);

  // Optical Density Details on Right Side
  const rightColX = margin + contentWidth - 85;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('PREDICTED OPTICAL DENSITY (H&D):', rightColX, cursorY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);

  if (data.filmLoadingMode === 'dual_composite') {
    doc.text(`Film 1 Density: ${data.film1PredictedDensity.toFixed(2)} H&D`, rightColX, cursorY + 10.5);
    doc.text(`Film 2 Density: ${data.film2PredictedDensity?.toFixed(2)} H&D`, rightColX, cursorY + 15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 83, 9);
    doc.text(`Composite Superimposed: ${data.compositeSuperimposedDensity?.toFixed(2)} H&D (Summed)`, rightColX, cursorY + 19.5);
  } else if (data.filmLoadingMode === 'dual_different') {
    doc.text(`Front F1 (${data.primaryFilmSpec.code}): ${data.film1PredictedDensity.toFixed(2)} H&D`, rightColX, cursorY + 10.5);
    doc.text(`Back F2 (${data.secondaryFilmSpec?.code}): ${data.film2PredictedDensity?.toFixed(2)} H&D`, rightColX, cursorY + 15);
    doc.text(`Latitude Ratio: ${data.speedRatioDescription || 'Wide Range'}`, rightColX, cursorY + 19.5);
  } else {
    doc.text(`Single Film Density: ${data.targetOpticalDensity.toFixed(2)} H&D`, rightColX, cursorY + 11);
    doc.text('Complies with ASME Sec V Art 2 Min Density 2.0', rightColX, cursorY + 16);
  }

  // Quality verification metrics underneath highlight box
  cursorY += 26;
  drawKeyValueRow(
    doc,
    [
      { label: 'Essential ASME Wire IQI:', value: `${data.essentialWireIdentity} (Ø ${data.essentialWireDiameterMm} mm)`, isBold: true },
      { label: 'Wire Set Designation:', value: data.iqiSetDesignation },
      {
        label: 'Geometric Unsharpness (Ug):',
        value: `${data.calculatedUgMm} mm (Max: ${data.maxAllowedUgMm} mm) · ${data.passesAsmeUg ? 'PASS' : 'FAIL'}`,
        isHighlight: !data.passesAsmeUg,
        isBold: true,
      },
    ],
    margin,
    cursorY,
    contentWidth
  );

  // -------------------------------------------------------------------------
  // 7. SECTION 5: RADIATION SAFETY BOUNDARY RADII (FIELD SAFETY)
  // -------------------------------------------------------------------------
  cursorY += 9;
  drawSectionHeader(doc, '5. FIELD RADIATION SAFETY & CONTROLLED BOUNDARIES (INVERSE SQUARE LAW)', margin, cursorY, contentWidth, [225, 29, 72]);
  cursorY += 7;

  drawKeyValueRow(
    doc,
    [
      {
        label: 'Controlled Area Barrier (2 mR/hr):',
        value: `${data.controlledAreaPerimeter2mR_Meters} Meters Radius`,
        isHighlight: true,
        isBold: true,
      },
      {
        label: 'Public Barricade (0.75 mR/hr):',
        value: `${data.publicBarricadePerimeter075mR_Meters} Meters Radius`,
        isBold: true,
      },
      {
        label: 'Safety Perimeter Rule:',
        value: 'Rope off with Warning Signs & Trefoil Flashing Lights',
      },
    ],
    margin,
    cursorY,
    contentWidth
  );

  // -------------------------------------------------------------------------
  // 8. SECTION 6: CERTIFICATION SIGN-OFF & STANDARDS CITATION
  // -------------------------------------------------------------------------
  cursorY += 10;
  drawSectionHeader(doc, '6. INSPECTION CERTIFICATION & RADIOGRAPHER SIGN-OFF', margin, cursorY, contentWidth);
  cursorY += 6;

  // Sign-off Box
  doc.setDrawColor(...slateBorder);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, cursorY, contentWidth, 23, 1.5, 1.5, 'FD');

  const signColWidth = contentWidth / 3;

  // Col 1: Prepared by
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Prepared By (Lead Radiographer):', margin + 3, cursorY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.text(data.leadRadiographer || 'Certified RT Level II Inspector', margin + 3, cursorY + 10);
  doc.text(`Cert ID: ${data.inspectorCertNumber || 'INSCO-RT-9712-4421'}`, margin + 3, cursorY + 14.5);
  doc.text(`Qualification: ASNT / ISO 9712 ${data.radiographerLevel || 'Level II'}`, margin + 3, cursorY + 19);

  // Col 2: Reviewed by
  doc.setFont('helvetica', 'bold');
  doc.text('Reviewed By (RT Level III):', margin + signColWidth + 3, cursorY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Technical NDT Director / Level III', margin + signColWidth + 3, cursorY + 10);
  doc.text('Approved RT Procedure: INSCO-RT-PR-02', margin + signColWidth + 3, cursorY + 14.5);
  doc.text('Valid Calibrated Survey Meter Used', margin + signColWidth + 3, cursorY + 19);

  // Col 3: Signature Stamp Area
  doc.setFont('helvetica', 'bold');
  doc.text('Official Stamp & Signature:', margin + signColWidth * 2 + 3, cursorY + 5);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin + signColWidth * 2 + 3, cursorY + 7.5, signColWidth - 8, 12.5, 'S');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('[Digitally Verified / Authorized]', margin + signColWidth * 2 + 8, cursorY + 15);

  // -------------------------------------------------------------------------
  // 9. FOOTER STRIP
  // -------------------------------------------------------------------------
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This radiographic calculation report was prepared in accordance with ASME Section V Article 2 & Agfa Structurix Exposure Curves. Page 1 of 1',
    margin,
    pageHeight - 6
  );
  doc.text('INSCO NDT Quality Management System', pageWidth - margin, pageHeight - 6, { align: 'right' });

  return doc;
}
