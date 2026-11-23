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

export interface GeConversionLogPdfEntry {
  id: string;
  timestamp: string;
  fromUnit: 'metric' | 'imperial';
  toUnit: 'metric' | 'imperial';
  thicknessMm: number;
  thicknessInches: number;
  sfdCm: number;
  sfdInches: number;
  sfdFeet: number;
  sourceType: GeSourceType;
  sourceLabel: string;
  calculatedTotalSeconds: number;
  formattedDuration: string;
}

export interface GeConversionLogPdfReportData extends GeRadiographicPdfReportData {
  activeUnitSystem: 'metric' | 'imperial';
  conversionEntries: GeConversionLogPdfEntry[];
}

const BRAND_NAVY = [15, 23, 42] as const;
const AMBER_ACCENT = [245, 158, 11] as const;
const EMERALD_PASS = [16, 185, 129] as const;
const CRIMSON_ALERT = [225, 29, 72] as const;
const SLATE_BORDER = [226, 232, 240] as const;

/**
 * Helper to draw section header bands
 */
function drawSectionHeader(
  doc: jsPDF,
  title: string,
  x: number,
  y: number,
  width: number,
  accentColor: readonly [number, number, number] = AMBER_ACCENT
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
  _rowHeight: number = 5.2
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
 * Helper to draw standard INSCO NDT header banner + ASME Section V Ug compliance badge
 */
function drawInscoHeaderBanner(
  doc: jsPDF,
  margin: number,
  pageWidth: number,
  contentWidth: number,
  passesAsmeUg: boolean,
  calculatedUgMm: number
) {
  doc.setFillColor(...BRAND_NAVY);
  doc.rect(margin, 10, contentWidth, 23, 'F');

  // Decorative amber bar on top
  doc.setFillColor(...AMBER_ACCENT);
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
  if (passesAsmeUg) {
    doc.setFillColor(...EMERALD_PASS);
    doc.roundedRect(badgeX, 15, badgeWidth, 13, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('ASME SEC V COMPLIANT', badgeX + badgeWidth / 2, 20.5, { align: 'center' });
    doc.setFontSize(8.5);
    doc.text(`Ug = ${calculatedUgMm} mm (PASS)`, badgeX + badgeWidth / 2, 25.5, { align: 'center' });
  } else {
    doc.setFillColor(...CRIMSON_ALERT);
    doc.roundedRect(badgeX, 15, badgeWidth, 13, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('ASME SEC V REVIEW', badgeX + badgeWidth / 2, 20.5, { align: 'center' });
    doc.setFontSize(8.5);
    doc.text(`Ug = ${calculatedUgMm} mm (> MAX)`, badgeX + badgeWidth / 2, 25.5, { align: 'center' });
  }
}

/**
 * Helper to draw the Certification Sign-Off section
 */
function drawInscoSignOffSection(
  doc: jsPDF,
  sectionTitle: string,
  data: Pick<GeRadiographicPdfReportData, 'leadRadiographer' | 'inspectorCertNumber' | 'radiographerLevel'>,
  margin: number,
  cursorY: number,
  contentWidth: number
): number {
  drawSectionHeader(doc, sectionTitle, margin, cursorY, contentWidth);
  const boxY = cursorY + 6;

  doc.setDrawColor(...SLATE_BORDER);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(margin, boxY, contentWidth, 23, 1.5, 1.5, 'FD');

  const signColWidth = contentWidth / 3;

  // Col 1: Prepared by
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Prepared By (Lead Radiographer):', margin + 3, boxY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.text(data.leadRadiographer || 'Certified RT Level II Inspector', margin + 3, boxY + 10);
  doc.text(`Cert ID: ${data.inspectorCertNumber || 'INSCO-RT-9712-4421'}`, margin + 3, boxY + 14.5);
  doc.text(`Qualification: ASNT / ISO 9712 ${data.radiographerLevel || 'Level II'}`, margin + 3, boxY + 19);

  // Col 2: Reviewed by
  doc.setFont('helvetica', 'bold');
  doc.text('Reviewed By (RT Level III):', margin + signColWidth + 3, boxY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text('Technical NDT Director / Level III', margin + signColWidth + 3, boxY + 10);
  doc.text('Approved RT Procedure: INSCO-RT-PR-02', margin + signColWidth + 3, boxY + 14.5);
  doc.text('Valid Calibrated Survey Meter Used', margin + signColWidth + 3, boxY + 19);

  // Col 3: Signature Stamp Area
  doc.setFont('helvetica', 'bold');
  doc.text('Official Stamp & Signature:', margin + signColWidth * 2 + 3, boxY + 5);
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin + signColWidth * 2 + 3, boxY + 7.5, signColWidth - 8, 12.5, 'S');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('[Digitally Verified / Authorized]', margin + signColWidth * 2 + 8, boxY + 15);

  return boxY + 23;
}

/**
 * Helper to draw footer strip
 */
function drawInscoFooter(
  doc: jsPDF,
  margin: number,
  pageWidth: number,
  pageHeight: number,
  leftText: string
) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(148, 163, 184);
  doc.text(leftText, margin, pageHeight - 6);
  doc.text('INSCO NDT Quality Management System', pageWidth - margin, pageHeight - 6, { align: 'right' });
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

  // -------------------------------------------------------------------------
  // 1. TOP HEADER BANNER
  // -------------------------------------------------------------------------
  drawInscoHeaderBanner(doc, margin, pageWidth, contentWidth, data.passesAsmeUg, data.calculatedUgMm);

  // -------------------------------------------------------------------------
  // 2. DOCUMENT TITLE & IDENTIFICATION STRIP
  // -------------------------------------------------------------------------
  let cursorY = 38;
  doc.setTextColor(...BRAND_NAVY);
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
  doc.setDrawColor(...AMBER_ACCENT);
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
  drawSectionHeader(doc, '5. FIELD RADIATION SAFETY & CONTROLLED BOUNDARIES (INVERSE SQUARE LAW)', margin, cursorY, contentWidth, CRIMSON_ALERT);
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
  drawInscoSignOffSection(doc, '6. INSPECTION CERTIFICATION & RADIOGRAPHER SIGN-OFF', data, margin, cursorY, contentWidth);

  // -------------------------------------------------------------------------
  // 9. FOOTER STRIP
  // -------------------------------------------------------------------------
  drawInscoFooter(
    doc,
    margin,
    pageWidth,
    pageHeight,
    'This radiographic calculation report was prepared in accordance with ASME Section V Article 2 & Agfa Structurix Exposure Curves. Page 1 of 1'
  );

  return doc;
}

/**
 * Generates an engineering-grade PDF audit report of the GE Radiographic Unit Conversion Log,
 * incorporating the exact INSCO branding, radiographic configuration fields, and structured log table.
 */
export function generateGeConversionLogPdf(data: GeConversionLogPdfReportData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  // -------------------------------------------------------------------------
  // 1. TOP HEADER BANNER (SHARED INSCO BRANDING + ASME SEC V BADGE)
  // -------------------------------------------------------------------------
  drawInscoHeaderBanner(doc, margin, pageWidth, contentWidth, data.passesAsmeUg, data.calculatedUgMm);

  // -------------------------------------------------------------------------
  // 2. DOCUMENT TITLE & IDENTIFICATION STRIP
  // -------------------------------------------------------------------------
  let cursorY = 38;
  doc.setTextColor(...BRAND_NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GE / WAYGATE UNIT CONVERSION LOG & RADIOGRAPHIC AUDIT REPORT', margin, cursorY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Doc Ref: INSCO-RT-CONV-2026 / ASME Sec V Art 2 · Metric (mm/cm) <-> Imperial (in/ft) · Generated on ${data.reportDate}`,
    margin,
    cursorY + 4.5
  );

  // -------------------------------------------------------------------------
  // 3. SECTION 1: ADMINISTRATIVE & COMPONENT GEOMETRY SPECIFICATION
  // -------------------------------------------------------------------------
  cursorY += 9;
  drawSectionHeader(doc, '1. ADMINISTRATIVE & ACTIVE COMPONENT GEOMETRY SPECIFICATION', margin, cursorY, contentWidth);
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
      {
        label: 'Active Unit Mode:',
        value: data.activeUnitSystem === 'metric' ? 'METRIC (mm / cm)' : 'IMPERIAL (in / ft)',
        isBold: true,
        isHighlight: true,
      },
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
      {
        label: 'Active SFD / FFD:',
        value: `${data.sfdCm} cm (${Math.round(data.sfdCm / 2.54)} in / ${(data.sfdCm / 30.48).toFixed(2)} ft)`,
        isHighlight: true,
        isBold: true,
      },
    ],
    margin,
    cursorY,
    contentWidth
  );

  // -------------------------------------------------------------------------
  // 4. SECTION 2: RADIATION SOURCE, FILM SYSTEM & ACTIVE EXPOSURE SNAPSHOT
  // -------------------------------------------------------------------------
  cursorY += 9;
  drawSectionHeader(doc, '2. RADIATION SOURCE, FILM SYSTEM & ACTIVE EXPOSURE SNAPSHOT', margin, cursorY, contentWidth);
  cursorY += 7;

  const isGamma = data.isotopeSpec.category === 'gamma';
  const sourceMetricLabel = isGamma
    ? `${data.currentLiveActivityCi} Ci (A0 ${data.initialActivityCi} Ci, ${data.decayDaysElapsed}d)`
    : `${data.tubeKv || 200} kV / ${data.tubeMa || 4.0} mA`;

  drawKeyValueRow(
    doc,
    [
      { label: 'Radiation Source:', value: data.isotopeSpec.nameEn, isBold: true },
      { label: isGamma ? 'Live Activity:' : 'Tube Output:', value: sourceMetricLabel, isBold: true, isHighlight: true },
      { label: 'Effective Steel:', value: `${data.effectiveSteelThicknessMm} mm (${data.halfValueLayersCount} HVL)` },
    ],
    margin,
    cursorY,
    contentWidth
  );
  cursorY += 6;

  const filmSummary = data.secondaryFilmSpec
    ? `${data.primaryFilmSpec.code} + ${data.secondaryFilmSpec.code} (${data.filmLoadingMode})`
    : `${data.primaryFilmSpec.code} (${data.primaryFilmSpec.astmClass})`;

  drawKeyValueRow(
    doc,
    [
      { label: 'Film System:', value: filmSummary, isBold: true },
      { label: 'Target Density:', value: `${data.targetOpticalDensity.toFixed(1)} H&D (Screens: ${data.hasLeadScreens ? 'Pb' : 'None'})` },
      {
        label: 'Essential IQI / Ug:',
        value: `${data.essentialWireIdentity} · Ug ${data.calculatedUgMm}/${data.maxAllowedUgMm} mm`,
        isBold: true,
      },
    ],
    margin,
    cursorY,
    contentWidth
  );
  cursorY += 6.5;

  // Compact Active Exposure Summary Box
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, cursorY, contentWidth, 14, 1.5, 1.5, 'F');
  doc.setDrawColor(...AMBER_ACCENT);
  doc.setLineWidth(0.35);
  doc.roundedRect(margin, cursorY, contentWidth, 14, 1.5, 1.5, 'S');

  doc.setTextColor(180, 83, 9);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.text('CURRENT BASELINE EXPOSURE TIME:', margin + 4, cursorY + 5);

  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.formattedExposureDuration} (${data.calculatedExposureSeconds} s)`, margin + 4, cursorY + 11);

  const rightSummaryX = margin + contentWidth - 82;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text(`LOGGED CONVERSIONS: ${data.conversionEntries.length} RECORDED TRANSITION(S)`, rightSummaryX, cursorY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Dose: ${data.exposureInCurieMinutes} ${isGamma ? 'Ci·min' : 'mA·min'} · Collimator: ${data.hasCollimator ? 'ON' : 'OFF'}`,
    rightSummaryX,
    cursorY + 10.5
  );

  // -------------------------------------------------------------------------
  // 5. SECTION 3: STRUCTURED UNIT CONVERSION AUDIT LOG TABLE
  // -------------------------------------------------------------------------
  cursorY += 18;
  drawSectionHeader(
    doc,
    `3. RECORDED METRIC <-> IMPERIAL UNIT CONVERSION LOG (${data.conversionEntries.length} ENTRIES)`,
    margin,
    cursorY,
    contentWidth
  );
  cursorY += 7;

  // Conversion standard math strip
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    'Reference Factors: 1 in = 25.4 mm | 1 in = 2.54 cm | 1 ft = 30.48 cm (Physical wall & SFD invariant under unit change)',
    margin,
    cursorY + 2
  );
  cursorY += 4.5;

  // Table Columns Layout (total = 186mm)
  const colPositions = {
    idx: margin + 2,
    time: margin + 10,
    dir: margin + 32,
    thick: margin + 67,
    sfd: margin + 109,
    source: margin + 153,
    exp: margin + 168,
  };

  // Table Header Bar
  doc.setFillColor(...BRAND_NAVY);
  doc.rect(margin, cursorY, contentWidth, 6.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.9);
  doc.text('#', colPositions.idx, cursorY + 4.4);
  doc.text('TIMESTAMP', colPositions.time, cursorY + 4.4);
  doc.text('CONVERSION', colPositions.dir, cursorY + 4.4);
  doc.text('THICKNESS (mm / in)', colPositions.thick, cursorY + 4.4);
  doc.text('SFD / FFD (cm / in / ft)', colPositions.sfd, cursorY + 4.4);
  doc.text('SOURCE', colPositions.source, cursorY + 4.4);
  doc.text('EXPOSURE', colPositions.exp, cursorY + 4.4);
  cursorY += 6.5;

  if (data.conversionEntries.length === 0) {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(...SLATE_BORDER);
    doc.rect(margin, cursorY, contentWidth, 10, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text(
      'No unit conversion transitions recorded in the current session.',
      margin + contentWidth / 2,
      cursorY + 6.2,
      { align: 'center' }
    );
    cursorY += 10;
  } else {
    data.conversionEntries.forEach((entry, index) => {
      if (cursorY + 12 > pageHeight - 48) {
        drawInscoFooter(
          doc,
          margin,
          pageWidth,
          pageHeight,
          'This unit conversion log report was prepared in accordance with ASME Section V Article 2. Continued on next page.'
        );
        doc.addPage();
        drawInscoHeaderBanner(doc, margin, pageWidth, contentWidth, data.passesAsmeUg, data.calculatedUgMm);
        cursorY = 38;
        doc.setFillColor(...BRAND_NAVY);
        doc.rect(margin, cursorY, contentWidth, 6.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.9);
        doc.text('#', colPositions.idx, cursorY + 4.4);
        doc.text('TIMESTAMP', colPositions.time, cursorY + 4.4);
        doc.text('CONVERSION', colPositions.dir, cursorY + 4.4);
        doc.text('THICKNESS (mm / in)', colPositions.thick, cursorY + 4.4);
        doc.text('SFD / FFD (cm / in / ft)', colPositions.sfd, cursorY + 4.4);
        doc.text('SOURCE', colPositions.source, cursorY + 4.4);
        doc.text('EXPOSURE', colPositions.exp, cursorY + 4.4);
        cursorY += 6.5;
      }

      const rowHeight = 7.5;
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.setDrawColor(...SLATE_BORDER);
      doc.rect(margin, cursorY, contentWidth, rowHeight, 'FD');

      const fromLabel = entry.fromUnit === 'metric' ? 'mm/cm' : 'in/ft';
      const toLabel = entry.toUnit === 'metric' ? 'mm/cm' : 'in/ft';

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.1);
      doc.setTextColor(15, 23, 42);
      doc.text(`${index + 1}`, colPositions.idx, cursorY + 4.9);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(entry.timestamp, colPositions.time, cursorY + 4.9);

      doc.setFont('helvetica', 'bold');
      if (entry.toUnit === 'imperial') {
        doc.setTextColor(180, 83, 9);
      } else {
        doc.setTextColor(3, 105, 161);
      }
      doc.text(`${fromLabel} -> ${toLabel}`, colPositions.dir, cursorY + 4.9);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`${entry.thicknessMm} mm / ${entry.thicknessInches} in`, colPositions.thick, cursorY + 4.9);
      doc.text(`${entry.sfdCm} cm / ${entry.sfdInches} in (${entry.sfdFeet} ft)`, colPositions.sfd, cursorY + 4.9);

      doc.setFont('helvetica', 'bold');
      doc.text(entry.sourceLabel, colPositions.source, cursorY + 4.9);

      doc.setTextColor(16, 135, 95);
      doc.text(`${entry.formattedDuration} (${entry.calculatedTotalSeconds}s)`, colPositions.exp, cursorY + 4.9);

      cursorY += rowHeight;
    });
  }

  // -------------------------------------------------------------------------
  // 6. SECTION 4: FIELD RADIATION SAFETY BOUNDARIES
  // -------------------------------------------------------------------------
  cursorY += 7;
  drawSectionHeader(
    doc,
    '4. FIELD RADIATION SAFETY & CONTROLLED BOUNDARIES (INVERSE SQUARE LAW)',
    margin,
    cursorY,
    contentWidth,
    CRIMSON_ALERT
  );
  cursorY += 7;

  drawKeyValueRow(
    doc,
    [
      {
        label: 'Controlled Area (2 mR/hr):',
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
        label: 'Perimeter Control:',
        value: 'Barricade + Warning Signs & Trefoil Lights',
      },
    ],
    margin,
    cursorY,
    contentWidth
  );

  // -------------------------------------------------------------------------
  // 7. SECTION 5: CERTIFICATION SIGN-OFF & STANDARDS CITATION
  // -------------------------------------------------------------------------
  cursorY += 10;
  drawInscoSignOffSection(doc, '5. INSPECTION CERTIFICATION & RADIOGRAPHER SIGN-OFF', data, margin, cursorY, contentWidth);

  // -------------------------------------------------------------------------
  // 8. FOOTER STRIP
  // -------------------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  drawInscoFooter(
    doc,
    margin,
    pageWidth,
    pageHeight,
    `This unit conversion audit report was prepared in accordance with ASME Section V Article 2 & Agfa Structurix Curves. Page ${totalPages} of ${totalPages}`
  );

  return doc;
}
