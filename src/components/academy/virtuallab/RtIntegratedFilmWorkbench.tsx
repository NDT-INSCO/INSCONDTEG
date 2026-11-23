import React, { useEffect, useMemo, useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Archive,
  ClipboardCheck,
  Scale,
  RefreshCw,
  ShieldCheck,
  Printer,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Language } from '../../../types';
import { clickableRow } from '../../../utils/a11y';
import { useTheme } from '../../../utils/themeStore';
import {
  AsmeIqiWireSelection,
  FilmDensityEvaluation,
  RtDefectClassification,
  RtFilmClassSpec,
  RtGoverningCodeId,
  RtSourceSpec,
  RtTechniqueSpec,
  RtWeldSpecimen,
  GeometricUnsharpnessResult,
} from '../../../data/rtSimulationData';
import {
  AR_RT_ACCEPTANCE_CODES,
  AR_RT_FILM_DEFECTS,
  ArRtAcceptanceCodeId,
  ArRtFilmDefectId,
} from '../../../data/arRadiographyCompleteEngine';
import {
  evaluateFilmReadingAcrossAllCodes,
  mapLabClassificationToArDefectId,
  RtSimulatorDefectSelection,
} from './RtAllCodesAcceptanceSimulator';
import { VirtualSignaturePad } from './VirtualSignaturePad';
import {
  buildRtFilmReportCsv,
  computeAllCodesAggregateForFilm,
  generateRtFilmInterpretationPdf,
  RtFilmDisposition,
  RtFilmIndicationEntry,
  RtFilmInterpretationReportData,
  RtRepairAction,
} from '../../../utils/rtFilmReportPdfGenerator';

export const RT_FILM_REPORTS_ARCHIVE_STORAGE_KEY =
  'rt_film_interpretation_reports_archive_v1';

export type RtWorkbenchTabId = 'evaluate' | 'codes_matrix' | 'report' | 'archive';

export interface RtIntegratedFilmWorkbenchProps {
  language: Language;
  specimen: RtWeldSpecimen;
  source: RtSourceSpec;
  technique: RtTechniqueSpec;
  filmClass: RtFilmClassSpec;
  sfdMm: number;
  activityCi: number;
  kv: number;
  ma: number;
  hasLeadScreens: boolean;
  hasBackscatterB: boolean;
  iqiPlacement: 'source_side' | 'film_side';
  iqiSelection: AsmeIqiWireSelection;
  ugResult: GeometricUnsharpnessResult;
  filmEval: FilmDensityEvaluation;
  traineeClassification: RtDefectClassification;
  traineeLengthMm: number;
  activeGoverningCode: RtGoverningCodeId;
  blindExamMode: boolean;
  hasSubmitted: boolean;
  onSelectGoverningCode?: (code: RtGoverningCodeId) => void;
}

function mapLabCodeToArCode(code: RtGoverningCodeId): ArRtAcceptanceCodeId {
  if (code === 'ASME_B31_3') return 'ASME_B31_3_NORMAL';
  if (code === 'API_1104') return 'API_1104';
  return 'ASME_VIII_UW51';
}

function mapArCodeToLabCode(code: ArRtAcceptanceCodeId): RtGoverningCodeId | null {
  if (code === 'ASME_VIII_UW51') return 'ASME_VIII_UW51';
  if (code === 'ASME_B31_3_NORMAL') return 'ASME_B31_3';
  if (code === 'API_1104') return 'API_1104';
  return null;
}

export function loadArchivedRtReports(): RtFilmInterpretationReportData[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(RT_FILM_REPORTS_ARCHIVE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function triggerFileDownload(blob: Blob, filename: string) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {
    // Graceful no-op if DOM download is mocked in tests
  }
}

export const RtIntegratedFilmWorkbench: React.FC<RtIntegratedFilmWorkbenchProps> = ({
  language,
  specimen,
  source,
  technique,
  filmClass,
  sfdMm,
  activityCi,
  kv,
  ma,
  hasLeadScreens,
  hasBackscatterB,
  iqiPlacement,
  iqiSelection,
  ugResult,
  filmEval,
  traineeClassification,
  traineeLengthMm,
  activeGoverningCode,
  blindExamMode,
  hasSubmitted,
  onSelectGoverningCode,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const StepArrow = isAr ? ChevronLeft : ChevronRight;

  const [activeTab, setActiveTab] = useState<RtWorkbenchTabId>('evaluate');
  const [governingCodeId, setGoverningCodeId] = useState<ArRtAcceptanceCodeId>(() =>
    mapLabCodeToArCode(activeGoverningCode)
  );

  useEffect(() => {
    setGoverningCodeId(mapLabCodeToArCode(activeGoverningCode));
  }, [activeGoverningCode]);

  // Defect Composer State (Section A)
  const [composerDefectId, setComposerDefectId] = useState<RtSimulatorDefectSelection>(() =>
    mapLabClassificationToArDefectId(traineeClassification)
  );
  const [filmSegment, setFilmSegment] = useState<string>('0-1');
  const [stationStartMm, setStationStartMm] = useState<number>(110);
  const [lengthMm, setLengthMm] = useState<number>(
    traineeClassification === 'sound' ? 0 : Math.max(1, traineeLengthMm)
  );
  const [widthMm, setWidthMm] = useState<number>(1.8);
  const [depthMm, setDepthMm] = useState<number>(1.6);
  const [countInWindow, setCountInWindow] = useState<number>(1);
  const [repairAction, setRepairAction] = useState<RtRepairAction>('LOCAL_GRIND_RE_RT');
  const [entryNotes, setEntryNotes] = useState<string>('');

  // Logged Indications for the current film
  const [indications, setIndications] = useState<RtFilmIndicationEntry[]>([]);
  const [selectedIndicationId, setSelectedIndicationId] = useState<string | null>(null);

  // Report Builder Metadata State (Section C)
  const [reportNumber, setReportNumber] = useState<string>(
    () => `RT-RPT-${new Date().getFullYear()}-${String(Math.floor(100 + Math.random() * 899))}`
  );
  const [inspectionDate, setInspectionDate] = useState<string>(
    () => new Date().toISOString().slice(0, 10)
  );
  const [clientName, setClientName] = useState<string>(
    isAr ? 'شركة بتروغاز للعمليات الصناعية' : 'PetroGas Process Industries'
  );
  const [projectFacility, setProjectFacility] = useState<string>(
    isAr ? 'وحدة التكسير الهيدروجيني — قطاع 04' : 'Hydrocracker Unit — Area 04'
  );
  const [lineOrEquipmentTag, setLineOrEquipmentTag] = useState<string>('12"-P-4012-A1A');
  const [welderStamp, setWelderStamp] = useState<string>('W-14');
  const [inspectorName, setInspectorName] = useState<string>('Eng. Ahmed Mansour');
  const [inspectorLevel, setInspectorLevel] = useState<'Level II' | 'Level III'>('Level II');
  const [inspectorCertNumber, setInspectorCertNumber] = useState<string>('ASNT-RT2-88419');
  const [reviewerName, setReviewerName] = useState<string>('Eng. Tarek El-Sayed (RT Level III)');
  const [inspectorComments, setInspectorComments] = useState<string>('');
  const [manualDispositionOverride, setManualDispositionOverride] =
    useState<RtFilmDisposition | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [exportBanner, setExportBanner] = useState<string | null>(null);

  // Archive State (Section D)
  const [archivedReports, setArchivedReports] = useState<RtFilmInterpretationReportData[]>(() =>
    loadArchivedRtReports()
  );

  // Reset indication composer & log when specimen changes
  useEffect(() => {
    const mapped = mapLabClassificationToArDefectId(traineeClassification);
    setComposerDefectId(mapped);
    setLengthMm(traineeClassification === 'sound' ? 0 : Math.max(0, traineeLengthMm));
    setIndications([]);
    setSelectedIndicationId(null);
    setManualDispositionOverride(null);
    setExportBanner(null);
  }, [specimen.id]);

  const syncComposerWithNegatoscope = () => {
    const mapped = mapLabClassificationToArDefectId(traineeClassification);
    setComposerDefectId(mapped);
    const effectiveLen = traineeClassification === 'sound' ? 0 : Math.max(0, traineeLengthMm);
    setLengthMm(effectiveLen);
    if (mapped !== 'sound') {
      const spec = AR_RT_FILM_DEFECTS.find((d) => d.id === mapped);
      if (spec) {
        setWidthMm(spec.defaultWidthMm);
        setDepthMm(Number(Math.max(0.4, specimen.wallThicknessMm * spec.defaultDepthRatio).toFixed(1)));
        setCountInWindow(spec.defaultCountInWindow);
        setRepairAction(
          spec.isPlanarCritical ? 'CUT_OUT' : 'LOCAL_GRIND_RE_RT'
        );
      }
    } else {
      setWidthMm(0);
      setDepthMm(0);
      setCountInWindow(0);
      setRepairAction('NONE');
    }
  };

  const handleComposerDefectChange = (nextId: RtSimulatorDefectSelection) => {
    setComposerDefectId(nextId);
    if (nextId === 'sound') {
      setLengthMm(0);
      setWidthMm(0);
      setDepthMm(0);
      setCountInWindow(0);
      setRepairAction('NONE');
    } else {
      const spec = AR_RT_FILM_DEFECTS.find((d) => d.id === nextId);
      if (spec) {
        setLengthMm(spec.defaultLengthMm);
        setWidthMm(spec.defaultWidthMm);
        setDepthMm(Number(Math.max(0.4, specimen.wallThicknessMm * spec.defaultDepthRatio).toFixed(1)));
        setCountInWindow(spec.defaultCountInWindow);
        setRepairAction(
          spec.isPlanarCritical ? 'CUT_OUT' : 'LOCAL_GRIND_RE_RT'
        );
      }
    }
  };

  const handleAddIndication = () => {
    const spec =
      composerDefectId === 'sound'
        ? null
        : AR_RT_FILM_DEFECTS.find((d) => d.id === composerDefectId) ?? AR_RT_FILM_DEFECTS[0];

    const effectiveLen = composerDefectId === 'sound' ? 0 : Math.max(0.5, lengthMm);
    const verdicts = evaluateFilmReadingAcrossAllCodes({
      defectId: composerDefectId,
      wallThicknessMm: specimen.wallThicknessMm,
      indicationLengthMm: effectiveLen,
      indicationWidthMm: composerDefectId === 'sound' ? 0 : widthMm,
      indicationDepthMm: composerDefectId === 'sound' ? 0 : depthMm,
      indicationCount: composerDefectId === 'sound' ? 0 : countInWindow,
    });

    const govVerdict = verdicts.find((v) => v.codeId === governingCodeId);
    const autoRepair: RtRepairAction =
      !filmEval.passesFilmQc
        ? 'RESHOOT_FILM'
        : govVerdict?.verdict === 'ACCEPT'
        ? 'NONE'
        : repairAction === 'NONE'
        ? 'LOCAL_GRIND_RE_RT'
        : repairAction;

    const newEntry: RtFilmIndicationEntry = {
      id: `ind-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      filmSegment,
      stationStartMm,
      stationEndMm: Number((stationStartMm + effectiveLen).toFixed(1)),
      defectId: composerDefectId,
      defectNameEn: spec ? spec.name.en : 'Sound Weld (No Rejectable Flaw)',
      defectNameAr: spec ? spec.name.ar : 'لحام سليم (لا توجد عيوب مرفوضة)',
      lengthMm: effectiveLen,
      widthMm: composerDefectId === 'sound' ? 0 : widthMm,
      depthMm: composerDefectId === 'sound' ? 0 : depthMm,
      countInWindow: composerDefectId === 'sound' ? 0 : countInWindow,
      repairAction: autoRepair,
      verdicts,
      notes: entryNotes.trim() || undefined,
    };

    setIndications((prev) => [...prev, newEntry]);
    setSelectedIndicationId(newEntry.id);
    setEntryNotes('');
    setStationStartMm((prev) => Math.min(230, prev + 25));
  };

  const handleRemoveIndication = (id: string) => {
    setIndications((prev) => prev.filter((item) => item.id !== id));
    if (selectedIndicationId === id) {
      setSelectedIndicationId(null);
    }
  };

  // Fallback preview verdicts if inspector hasn't added any rows yet
  const effectiveIndicationsForMatrix = useMemo<RtFilmIndicationEntry[]>(() => {
    if (indications.length > 0) return indications;
    const mapped = mapLabClassificationToArDefectId(traineeClassification);
    const spec = mapped === 'sound' ? null : AR_RT_FILM_DEFECTS.find((d) => d.id === mapped);
    const len = mapped === 'sound' ? 0 : Math.max(0.5, traineeLengthMm);
    return [
      {
        id: 'live-active-preview',
        filmSegment: '0-1',
        stationStartMm: 110,
        stationEndMm: Number((110 + len).toFixed(1)),
        defectId: mapped,
        defectNameEn: spec ? spec.name.en : 'Sound Weld (Active Reading)',
        defectNameAr: spec ? spec.name.ar : 'لحام سليم (القراءة الحالية)',
        lengthMm: len,
        widthMm: spec ? spec.defaultWidthMm : 0,
        depthMm: spec ? Number((specimen.wallThicknessMm * spec.defaultDepthRatio).toFixed(1)) : 0,
        countInWindow: spec ? spec.defaultCountInWindow : 0,
        repairAction: 'NONE',
        verdicts: evaluateFilmReadingAcrossAllCodes({
          defectId: mapped,
          wallThicknessMm: specimen.wallThicknessMm,
          indicationLengthMm: len,
          indicationWidthMm: spec ? spec.defaultWidthMm : 0,
          indicationDepthMm: spec ? specimen.wallThicknessMm * spec.defaultDepthRatio : 0,
          indicationCount: spec ? spec.defaultCountInWindow : 0,
        }),
      },
    ];
  }, [indications, traineeClassification, traineeLengthMm, specimen.wallThicknessMm]);

  const allCodesAggregate = useMemo(
    () => computeAllCodesAggregateForFilm(effectiveIndicationsForMatrix),
    [effectiveIndicationsForMatrix]
  );

  const activeCodeAggregate = useMemo(
    () =>
      allCodesAggregate.find((c) => c.codeId === governingCodeId) ??
      allCodesAggregate[0],
    [allCodesAggregate, governingCodeId]
  );

  const computedDisposition: RtFilmDisposition = useMemo(() => {
    if (!filmEval.passesFilmQc) return 'RESHOOT_REQUIRED';
    if (activeCodeAggregate?.verdict === 'REJECT') return 'REJECTED_REPAIR';
    return 'ACCEPTED';
  }, [filmEval.passesFilmQc, activeCodeAggregate]);

  const finalDisposition = manualDispositionOverride ?? computedDisposition;

  const activeGovCodeMeta = useMemo(
    () =>
      AR_RT_ACCEPTANCE_CODES.find((c) => c.id === governingCodeId) ??
      AR_RT_ACCEPTANCE_CODES[0],
    [governingCodeId]
  );

  const focusedIndication = useMemo(
    () =>
      indications.find((item) => item.id === selectedIndicationId) ??
      indications[indications.length - 1] ??
      effectiveIndicationsForMatrix[0],
    [indications, selectedIndicationId, effectiveIndicationsForMatrix]
  );

  const buildReportPayload = (): RtFilmInterpretationReportData => ({
    reportNumber: reportNumber.trim() || `RT-RPT-${Date.now()}`,
    inspectionDate,
    clientName: clientName.trim() || 'Industrial Client',
    projectFacility: projectFacility.trim() || 'Refinery Unit',
    lineOrEquipmentTag: lineOrEquipmentTag.trim() || specimen.weldTag,
    weldJointId: specimen.weldTag,
    welderStamp: welderStamp.trim() || 'W-01',
    materialSpec: specimen.materialSpec,
    weldingProcess: specimen.weldingProcess,
    wallThicknessMm: specimen.wallThicknessMm,
    outerDiameterMm: specimen.outerDiameterMm,
    sourceShortCode: source.shortCode,
    energySummary:
      source.category === 'gamma' ? `${activityCi} Ci` : `${kv} kV / ${ma} mA`,
    techniqueCode: technique.shortCode,
    sfdMm,
    filmClassLabel: filmClass.name[language],
    hasLeadScreens,
    hasBackscatterB,
    iqiDesignation: `ASTM ${iqiSelection.setId} (Wire #${iqiSelection.essentialWireNumber})`,
    iqiPlacement,
    visibleIqiWires: filmEval.visibleWiresCount,
    requiredIqiWires: 6,
    calculatedUgMm: ugResult.ugMm,
    maxAllowedUgMm: ugResult.maxAllowedUgMm,
    weldOpticalDensity: filmEval.weldMetalDensity,
    baseOpticalDensity: filmEval.baseMetalDensity,
    passesFilmQc: filmEval.passesFilmQc,
    governingCodeId,
    governingCodeLabel: activeGovCodeMeta.shortCode,
    finalDisposition,
    indications: effectiveIndicationsForMatrix,
    inspectorName: inspectorName.trim() || 'Certified RT Inspector',
    inspectorLevel,
    inspectorCertNumber: inspectorCertNumber.trim() || 'ISO9712-RT2',
    reviewerName: reviewerName.trim() || undefined,
    inspectorComments:
      inspectorComments.trim() ||
      `Film interpreted under ${activeGovCodeMeta.shortCode}. Optical density ${filmEval.weldMetalDensity} H&D, IQI ${filmEval.visibleWiresCount}/6 wires.`,
    signatureDataUrl,
    language,
    savedAtIso: new Date().toISOString(),
  });

  const handleSelectGovCode = (codeId: ArRtAcceptanceCodeId) => {
    setGoverningCodeId(codeId);
    const mappedLab = mapArCodeToLabCode(codeId);
    if (mappedLab && onSelectGoverningCode) {
      onSelectGoverningCode(mappedLab);
    }
  };

  const handleExportPdf = (targetData?: RtFilmInterpretationReportData) => {
    const payload = targetData ?? buildReportPayload();
    const doc = generateRtFilmInterpretationPdf(payload);
    try {
      const pdfBlob = doc.output('blob');
      triggerFileDownload(pdfBlob, `${payload.reportNumber}.pdf`);
    } catch {
      try {
        doc.save(`${payload.reportNumber}.pdf`);
      } catch {
        // Ignore in environments without browser Blob support
      }
    }
    setExportBanner(
      isAr
        ? `تم إنشاء وتحميل التقرير الهندسي ${payload.reportNumber}.pdf بنجاح (${payload.indications.length} مؤشر · 7 أكواد).`
        : `Generated & downloaded ${payload.reportNumber}.pdf (${payload.indications.length} indication(s) · 7 codes).`
    );
  };

  const handleExportCsv = (targetData?: RtFilmInterpretationReportData) => {
    const payload = targetData ?? buildReportPayload();
    const csv = buildRtFilmReportCsv(payload);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerFileDownload(blob, `${payload.reportNumber}_all_codes.csv`);
    setExportBanner(
      isAr
        ? `تم تصدير جدول العيوب والأكواد السبعة إلى ${payload.reportNumber}_all_codes.csv.`
        : `Exported indications & 7-code verdicts to ${payload.reportNumber}_all_codes.csv.`
    );
  };

  const handleSaveToArchive = () => {
    const payload = buildReportPayload();
    const nextArchive = [
      payload,
      ...archivedReports.filter((r) => r.reportNumber !== payload.reportNumber),
    ].slice(0, 20);
    setArchivedReports(nextArchive);
    try {
      localStorage.setItem(
        RT_FILM_REPORTS_ARCHIVE_STORAGE_KEY,
        JSON.stringify(nextArchive)
      );
    } catch {
      // Ignore storage quota errors
    }
    setExportBanner(
      isAr
        ? `تم حفظ التقرير ${payload.reportNumber} في أرشيف تقارير قراءة الأفلام.`
        : `Saved report ${payload.reportNumber} to RT Film Reports Archive.`
    );
  };

  const handleDeleteArchived = (repNo: string) => {
    const nextArchive = archivedReports.filter((r) => r.reportNumber !== repNo);
    setArchivedReports(nextArchive);
    try {
      localStorage.setItem(
        RT_FILM_REPORTS_ARCHIVE_STORAGE_KEY,
        JSON.stringify(nextArchive)
      );
    } catch {
      // Ignore
    }
  };

  const handleLoadArchived = (rep: RtFilmInterpretationReportData) => {
    setReportNumber(rep.reportNumber);
    setInspectionDate(rep.inspectionDate);
    setClientName(rep.clientName);
    setProjectFacility(rep.projectFacility);
    setLineOrEquipmentTag(rep.lineOrEquipmentTag);
    setWelderStamp(rep.welderStamp);
    setInspectorName(rep.inspectorName);
    setInspectorLevel(rep.inspectorLevel);
    setInspectorCertNumber(rep.inspectorCertNumber);
    setReviewerName(rep.reviewerName || '');
    setInspectorComments(rep.inspectorComments);
    setGoverningCodeId(rep.governingCodeId);
    setIndications(rep.indications);
    setManualDispositionOverride(rep.finalDisposition);
    setActiveTab('report');
  };

  const shellBg = isLight
    ? 'bg-white border-slate-200 text-slate-900'
    : 'bg-slate-900/95 border-slate-800 text-slate-100';
  const subCardBg = isLight
    ? 'bg-slate-50 border-slate-200'
    : 'bg-slate-950/90 border-slate-800';
  const inputBg = isLight
    ? 'bg-white border-slate-300 text-slate-900'
    : 'bg-slate-900 border-slate-700 text-slate-100';

  const acceptCodeCount = allCodesAggregate.filter((c) => c.verdict === 'ACCEPT').length;

  return (
    <section
      data-testid="rt-integrated-film-workbench"
      className={`rounded-2xl border p-5 sm:p-6 space-y-5 shadow-xl ${shellBg}`}
    >
      {/* Workbench Header + End-to-End Pipeline Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/30">
        <div>
          <div className="text-[11px] font-mono font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            <span>
              {isAr
                ? 'محطة العمل المتكاملة لقراءة الأفلام وإصدار التقارير الهندسية'
                : 'Integrated RT Film Interpretation & Multi-Code Reporting Workbench'}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black mt-1">
            {isAr
              ? 'من فحص العيب عبر جميع الأكواد إلى التقرير المعتمد والتوقيع الرقمي'
              : 'From Multi-Indication Defect Evaluation Across All 7 Codes to Signed Engineering Reports'}
          </h3>
          <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2 font-mono tabular-nums">
            <span>{specimen.weldTag}</span>
            <span aria-hidden="true">·</span>
            <span>t = {specimen.wallThicknessMm} mm</span>
            <span aria-hidden="true">·</span>
            <span>H&D {filmEval.weldMetalDensity}</span>
            <span aria-hidden="true">·</span>
            <span>IQI {filmEval.visibleWiresCount}/6</span>
            <span aria-hidden="true">·</span>
            <span>Ug {ugResult.ugMm} mm</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums">
          <div
            data-testid="rt-workbench-codes-summary"
            className={`px-3 py-2 rounded-xl border font-bold ${
              acceptCodeCount === 7
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500'
                : acceptCodeCount === 0
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-500'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-500'
            }`}
          >
            {acceptCodeCount} / 7 {isAr ? 'أكواد قبول' : 'Codes Accept'}
          </div>
          <div
            data-testid="rt-workbench-disposition-badge"
            className={`px-3 py-2 rounded-xl border font-black ${
              finalDisposition === 'ACCEPTED'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : finalDisposition === 'RESHOOT_REQUIRED'
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-rose-600 text-white border-rose-500'
            }`}
          >
            {finalDisposition === 'ACCEPTED'
              ? isAr
                ? 'القرار: مقبول (ACCEPT)'
                : 'DISPOSITION: ACCEPTED'
              : finalDisposition === 'RESHOOT_REQUIRED'
              ? isAr
                ? 'القرار: إعادة تصوير (RESHOOT)'
                : 'DISPOSITION: RESHOOT'
              : isAr
              ? 'القرار: مرفوض / إصلاح (REJECT)'
              : 'DISPOSITION: REJECTED'}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {(
          [
            {
              id: 'evaluate' as const,
              num: '01',
              icon: Plus,
              label: isAr
                ? `تقييم وتسجيل العيوب (${indications.length})`
                : `1. Defect Log (${indications.length})`,
            },
            {
              id: 'codes_matrix' as const,
              num: '02',
              icon: Scale,
              label: isAr
                ? 'مصفوفة جميع الأكواد (7)'
                : '2. All-7-Codes Matrix',
            },
            {
              id: 'report' as const,
              num: '03',
              icon: FileText,
              label: isAr
                ? 'إصدار التقرير والتوقيع'
                : '3. Report & Sign-Off',
            },
            {
              id: 'archive' as const,
              num: '04',
              icon: Archive,
              label: isAr
                ? `أرشيف التقارير (${archivedReports.length})`
                : `4. Archive (${archivedReports.length})`,
            },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={`rt-workbench-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                active
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : isLight
                  ? 'bg-slate-50 text-slate-700 border-slate-200 hover:border-amber-400'
                  : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:border-slate-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Film QC Warning Banner if Density / IQI / Ug out of ASME V tolerance */}
      {!filmEval.passesFilmQc && (
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/10 p-3.5 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              {isAr
                ? `تنبيه جودة الفيلم (ASME V): الكثافة ${filmEval.weldMetalDensity} أو سلك IQI (${filmEval.visibleWiresCount}/6) أو Ug (${ugResult.ugMm} مم) خارج الحدود القياسية — قد يلزم إعادة التصوير (Reshoot).`
                : `Film QC Alert (ASME Sec V): Optical density (${filmEval.weldMetalDensity}), IQI (${filmEval.visibleWiresCount}/6), or Ug (${ugResult.ugMm} mm) is out of specification — film may require Reshoot.`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setManualDispositionOverride('RESHOOT_REQUIRED')}
            className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold cursor-pointer"
          >
            {isAr ? 'تحديد إعادة تصوير' : 'Flag Reshoot'}
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 1: MULTI-INDICATION DEFECT EVALUATION & FILM LOG              */}
      {/* ================================================================= */}
      {activeTab === 'evaluate' && (
        <div className="space-y-5">
          {/* Defect Composer Card */}
          <div className={`rounded-xl border p-4 space-y-4 ${subCardBg}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-black">
                {isAr
                  ? 'إضافة مؤشر إشعاعي من الفيلم إلى سجل التقييم (18 نوع عيب)'
                  : 'Log Radiographic Indication to Film Sheet (18 Flaw Classes)'}
              </div>
              <button
                type="button"
                data-testid="rt-workbench-sync-negatoscope"
                onClick={syncComposerWithNegatoscope}
                className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-300 hover:bg-cyan-100'
                    : 'bg-cyan-950/50 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/50'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? `مزامنة قراءة النيجاتوسكوب (${traineeLengthMm} مم)`
                    : `Sync Active Negatoscope (${traineeLengthMm} mm)`}
                </span>
              </button>
            </div>

            {blindExamMode && !hasSubmitted && (
              <div className="text-[11px] text-amber-400 font-mono">
                {isAr
                  ? 'وضع الاختبار الأعمى نشط: قيّم العيب بناءً على قياسات المسطرة والكثافة التي استخرجتها بنفسك.'
                  : 'Blind Exam Mode active: evaluate using your own Negatoscope caliper and density readings.'}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label
                  htmlFor="rt-workbench-defect-select"
                  className="block text-xs font-bold"
                >
                  {isAr ? 'نوع العيب الإشعاعي:' : 'Discontinuity / Flaw Class:'}
                </label>
                <select
                  id="rt-workbench-defect-select"
                  data-testid="rt-workbench-defect-select"
                  value={composerDefectId}
                  onChange={(e) =>
                    handleComposerDefectChange(e.target.value as RtSimulatorDefectSelection)
                  }
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-bold ${inputBg}`}
                >
                  {AR_RT_FILM_DEFECTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name[language]} ({d.codeSymbol})
                    </option>
                  ))}
                  <option value="sound">
                    {isAr
                      ? 'خالي من العيوب — لحام سليم (No Rejectable Flaw)'
                      : 'No Rejectable Flaw — Sound Weld'}
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="rt-wb-segment" className="block text-xs font-bold">
                  {isAr ? 'قطاع الفيلم (Film Seg):' : 'Film Segment:'}
                </label>
                <select
                  id="rt-wb-segment"
                  value={filmSegment}
                  onChange={(e) => setFilmSegment(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-mono font-bold ${inputBg}`}
                >
                  <option value="0-1">0-1</option>
                  <option value="1-2">1-2</option>
                  <option value="2-3">2-3</option>
                  <option value="A-B">A-B</option>
                  <option value="B-C">B-C</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="rt-wb-station" className="block text-xs font-bold">
                  {isAr ? 'بداية الموقع (mm):' : 'Start Station (mm):'}
                </label>
                <input
                  id="rt-wb-station"
                  type="number"
                  min={0}
                  max={250}
                  step={1}
                  value={stationStartMm}
                  onChange={(e) => setStationStartMm(Math.max(0, Number(e.target.value)))}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-mono font-bold tabular-nums ${inputBg}`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="rt-wb-length" className="block text-xs font-bold">
                  {isAr ? 'الطول L (mm):' : 'Length L (mm):'}
                </label>
                <input
                  id="rt-wb-length"
                  data-testid="rt-workbench-length-input"
                  type="number"
                  min={0}
                  max={150}
                  step={0.5}
                  value={lengthMm}
                  onChange={(e) => setLengthMm(Math.max(0, Number(e.target.value)))}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-mono font-bold tabular-nums ${inputBg}`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="rt-wb-width" className="block text-xs font-bold">
                  {isAr ? 'العرض W (mm):' : 'Width W (mm):'}
                </label>
                <input
                  id="rt-wb-width"
                  type="number"
                  min={0}
                  max={25}
                  step={0.2}
                  value={widthMm}
                  onChange={(e) => setWidthMm(Math.max(0, Number(e.target.value)))}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-mono font-bold tabular-nums ${inputBg}`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="rt-wb-depth" className="block text-xs font-bold">
                  {isAr ? 'العمق التقديري D (mm):' : 'Est. Depth D (mm):'}
                </label>
                <input
                  id="rt-wb-depth"
                  type="number"
                  min={0}
                  max={30}
                  step={0.2}
                  value={depthMm}
                  onChange={(e) => setDepthMm(Math.max(0, Number(e.target.value)))}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-mono font-bold tabular-nums ${inputBg}`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="rt-wb-action" className="block text-xs font-bold">
                  {isAr ? 'إجراء الإصلاح المقترح:' : 'Proposed Action:'}
                </label>
                <select
                  id="rt-wb-action"
                  value={repairAction}
                  onChange={(e) => setRepairAction(e.target.value as RtRepairAction)}
                  className={`w-full px-3 py-2 rounded-lg border text-xs font-bold ${inputBg}`}
                >
                  <option value="NONE">{isAr ? 'لا يوجد (مقبول)' : 'None (Accept)'}</option>
                  <option value="LOCAL_GRIND_RE_RT">
                    {isAr ? 'تجليخ موضعي وإعادة RT' : 'Local Grind & Re-RT'}
                  </option>
                  <option value="CUT_OUT">
                    {isAr ? 'قطع الوصلة وإعادة اللحام' : 'Cut-Out & Reweld'}
                  </option>
                  <option value="RESHOOT_FILM">
                    {isAr ? 'إعادة تصوير الفيلم (Reshoot)' : 'Reshoot Film'}
                  </option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                value={entryNotes}
                onChange={(e) => setEntryNotes(e.target.value)}
                placeholder={
                  isAr
                    ? 'ملاحظات إضافية على الموقع أو الجذر/الغطاء (اختياري)...'
                    : 'Optional remarks (e.g., root side, HAZ toe, cluster cluster spacing)...'
                }
                className={`flex-1 px-3 py-2 rounded-lg border text-xs ${inputBg}`}
              />
              <button
                type="button"
                data-testid="rt-workbench-add-indication"
                onClick={handleAddIndication}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isAr
                    ? 'إضافة العيب وتقييمه بجميع الأكواد'
                    : 'Add Indication & Evaluate All 7 Codes'}
                </span>
              </button>
            </div>
          </div>

          {/* Recorded Film Indications Log Table */}
          <div className={`rounded-xl border overflow-hidden ${subCardBg}`}>
            <div className="px-4 py-3 border-b border-slate-700/30 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-black">
                {isAr
                  ? `سجل مؤشرات الفيلم المسجلة (${indications.length})`
                  : `Recorded Film Indications Log (${indications.length})`}
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('codes_matrix')}
                className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>
                  {isAr ? 'الانتقال لمصفوفة الأكواد السبعة' : 'Proceed to 7-Code Matrix'}
                </span>
                <StepArrow className="w-3.5 h-3.5" />
              </button>
            </div>

            {indications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                {isAr
                  ? 'لم تُسجّل عيوب مخصصة بعد — يمكنك الضغط على "إضافة العيب وتقييمه بجميع الأكواد" لإدراج عيب واحد أو عدة عيوب في التقرير النهائي.'
                  : 'No custom indications logged yet — click "Add Indication & Evaluate All 7 Codes" above to build a single or multi-defect film report.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table
                  data-testid="rt-workbench-indications-table"
                  className="w-full text-xs text-start border-collapse"
                >
                  <thead>
                    <tr className="border-b border-slate-700/30 text-[11px] font-mono text-slate-400 uppercase">
                      <th className="py-2.5 px-3 text-start">{isAr ? 'القطاع' : 'Seg'}</th>
                      <th className="py-2.5 px-3 text-start">{isAr ? 'المحطة (mm)' : 'Station'}</th>
                      <th className="py-2.5 px-3 text-start">{isAr ? 'نوع العيب' : 'Indication'}</th>
                      <th className="py-2.5 px-3 text-start">{isAr ? 'الأبعاد L×W×D' : 'Dimensions'}</th>
                      <th className="py-2.5 px-3 text-start">
                        {isAr ? 'قبول الأكواد' : '7-Code Pass'}
                      </th>
                      <th className="py-2.5 px-3 text-start">
                        {isAr ? `حكم ${activeGovCodeMeta.shortCode}` : activeGovCodeMeta.shortCode}
                      </th>
                      <th className="py-2.5 px-3 text-end">{isAr ? 'إجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/20 tabular-nums">
                    {indications.map((entry) => {
                      const passCount = entry.verdicts.filter((v) => v.verdict === 'ACCEPT').length;
                      const gov = entry.verdicts.find((v) => v.codeId === governingCodeId);
                      const isRej = gov?.verdict === 'REJECT';
                      const isFocused = focusedIndication?.id === entry.id;
                      const rowSelection = clickableRow(() => setSelectedIndicationId(entry.id), isFocused);
                      return (
                        <tr
                          key={entry.id}
                          {...rowSelection}
                          onKeyDown={event => {
                            // Leave keyboard activation of the row's Remove button to the browser.
                            if (event.target === event.currentTarget) rowSelection.onKeyDown(event);
                          }}
                          className={`cursor-pointer transition focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-amber-500 ${
                            isFocused ? 'bg-amber-500/10' : 'hover:bg-slate-800/30'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold">{entry.filmSegment}</td>
                          <td className="py-2.5 px-3 font-mono">
                            {entry.stationStartMm}–{entry.stationEndMm} mm
                          </td>
                          <td className="py-2.5 px-3 font-bold">
                            {isAr ? entry.defectNameAr : entry.defectNameEn}
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {entry.defectId === 'sound'
                              ? '0 mm'
                              : `${entry.lengthMm.toFixed(1)}×${entry.widthMm.toFixed(1)}×${entry.depthMm.toFixed(1)}`}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold">
                            <span
                              className={
                                passCount === 7
                                  ? 'text-emerald-500'
                                  : passCount === 0
                                  ? 'text-rose-500'
                                  : 'text-amber-500'
                              }
                            >
                              {passCount} / 7
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`inline-flex items-center gap-1 font-mono font-black ${
                                isRej ? 'text-rose-500' : 'text-emerald-500'
                              }`}
                            >
                              {isRej ? (
                                <XCircle className="w-3.5 h-3.5" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>{gov?.verdict ?? 'ACCEPT'}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-end">
                            <button
                              type="button"
                              aria-label={isAr ? 'حذف المؤشر' : 'Remove indication'}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveIndication(entry.id);
                              }}
                              className="p-1 rounded text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: ALL-7-CODES AGGREGATE FILM MATRIX & GOVERNING SELECTION    */}
      {/* ================================================================= */}
      {activeTab === 'codes_matrix' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="text-slate-400">
              {isAr
                ? 'تقييم إجمالي الفيلم عبر الـ 7 أكواد العالمية (يرفض الكود الفيلم إذا تجاوز أي عيب مسجّل حد القبول):'
                : 'Aggregate film verdict across all 7 international codes (a code rejects the film if any logged indication exceeds its threshold):'}
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className="font-bold text-amber-500 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{isAr ? 'الانتقال لإصدار التقرير' : 'Proceed to Report Builder'}</span>
              <StepArrow className="w-3.5 h-3.5" />
            </button>
          </div>

          <div
            data-testid="rt-workbench-all-codes-matrix"
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {allCodesAggregate.map((row) => {
              const isGov = row.codeId === governingCodeId;
              const isAccept = row.verdict === 'ACCEPT';
              return (
                <div
                  key={row.codeId}
                  data-testid={`rt-workbench-matrix-card-${row.codeId}`}
                  className={`rounded-xl border p-4 space-y-2.5 transition ${
                    isGov
                      ? 'border-amber-500 bg-amber-500/5'
                      : isAccept
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-rose-500/30 bg-rose-500/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-black flex items-center gap-2">
                        <span>{row.shortCode}</span>
                        {isGov && (
                          <span className="text-[10px] font-mono text-amber-500">
                            · {isAr ? 'الكود الحاكم المختار' : 'ACTIVE GOVERNING'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {row.clauseRef}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 font-mono font-black text-xs ${
                        isAccept ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      {isAccept ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span>{row.verdict}</span>
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono tabular-nums space-y-1">
                    <div>
                      {isAr ? 'المؤشر الحاكم:' : 'Limiting flaw:'}{' '}
                      <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>
                        {isAr ? row.limitingDefectAr : row.limitingDefectEn}
                      </strong>
                      {row.rejectingCount > 0 && (
                        <span className="text-rose-400">
                          {' '}
                          ({row.rejectingCount} {isAr ? 'مرفوض' : 'rejected'})
                        </span>
                      )}
                    </div>
                    <div>
                      {isAr ? 'الحد الأقصى:' : 'Max Limit:'}{' '}
                      {row.maxAllowedMm > 0 ? `${row.maxAllowedMm} mm` : '0 mm (Zero Tolerance)'}
                      {' · '}
                      {isAr ? 'ذروة الاستهلاك:' : 'Peak Util:'} {row.peakUtilizationPct}%
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-800/40 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isAccept ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.min(100, row.peakUtilizationPct)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-slate-400 truncate">
                      {row.ruleFormula}
                    </span>
                    <button
                      type="button"
                      data-testid={`rt-workbench-set-gov-${row.codeId}`}
                      onClick={() => handleSelectGovCode(row.codeId)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold shrink-0 cursor-pointer ${
                        isGov
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : isLight
                          ? 'bg-white text-slate-700 border-slate-300 hover:border-amber-400'
                          : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-amber-500'
                      }`}
                    >
                      {isGov
                        ? isAr
                          ? 'الكود المعتمد'
                          : 'Governing'
                        : isAr
                        ? 'اعتماد للتقرير'
                        : 'Use in Report'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: REPORT BUILDER, DIGITAL SIGNATURE & PDF/CSV EXPORT         */}
      {/* ================================================================= */}
      {activeTab === 'report' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left 7 cols: Form & Signature */}
          <div className={`lg:col-span-7 rounded-xl border p-4 space-y-4 ${subCardBg}`}>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-700/30">
              <div className="text-sm font-black">
                {isAr
                  ? 'بيانات تقرير التصوير الإشعاعي والاعتماد (RT Report Dossier)'
                  : 'RT Inspection Report Header & Sign-Off Details'}
              </div>
              <span className="text-[11px] font-mono text-cyan-400">
                {activeGovCodeMeta.shortCode} · {effectiveIndicationsForMatrix.length}{' '}
                {isAr ? 'مؤشر' : 'entry(s)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label htmlFor="rt-rpt-no" className="block font-bold">
                  {isAr ? 'رقم التقرير:' : 'Report Number:'}
                </label>
                <input
                  id="rt-rpt-no"
                  data-testid="rt-report-number-input"
                  type="text"
                  value={reportNumber}
                  onChange={(e) => setReportNumber(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border font-mono font-bold ${inputBg}`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="rt-rpt-date" className="block font-bold">
                  {isAr ? 'تاريخ الفحص:' : 'Inspection Date:'}
                </label>
                <input
                  id="rt-rpt-date"
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border font-mono ${inputBg}`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="rt-rpt-client" className="block font-bold">
                  {isAr ? 'العميل / الجهة المالكة:' : 'Client / Owner:'}
                </label>
                <input
                  id="rt-rpt-client"
                  data-testid="rt-report-client-input"
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${inputBg}`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="rt-rpt-facility" className="block font-bold">
                  {isAr ? 'الموقع / المحطة:' : 'Project / Plant:'}
                </label>
                <input
                  id="rt-rpt-facility"
                  type="text"
                  value={projectFacility}
                  onChange={(e) => setProjectFacility(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${inputBg}`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="rt-rpt-line" className="block font-bold">
                  {isAr ? 'رقم الخط / المعدة:' : 'Line / Equipment Tag:'}
                </label>
                <input
                  id="rt-rpt-line"
                  type="text"
                  value={lineOrEquipmentTag}
                  onChange={(e) => setLineOrEquipmentTag(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border font-mono ${inputBg}`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="rt-rpt-welder" className="block font-bold">
                  {isAr ? 'كود اللحام (Welder ID):' : 'Welder Stamp:'}
                </label>
                <input
                  id="rt-rpt-welder"
                  type="text"
                  value={welderStamp}
                  onChange={(e) => setWelderStamp(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border font-mono font-bold ${inputBg}`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="rt-rpt-inspector" className="block font-bold">
                  {isAr ? 'اسم مفتش الأشعة:' : 'RT Inspector Name:'}
                </label>
                <input
                  id="rt-rpt-inspector"
                  data-testid="rt-report-inspector-input"
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border font-bold ${inputBg}`}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="rt-rpt-cert" className="block font-bold">
                  {isAr ? 'المستوى ورقم الشهادة:' : 'Level & Cert No:'}
                </label>
                <div className="flex gap-2">
                  <select
                    value={inspectorLevel}
                    onChange={(e) =>
                      setInspectorLevel(e.target.value as 'Level II' | 'Level III')
                    }
                    className={`px-2.5 py-2 rounded-lg border font-bold ${inputBg}`}
                  >
                    <option value="Level II">Level II</option>
                    <option value="Level III">Level III</option>
                  </select>
                  <input
                    id="rt-rpt-cert"
                    type="text"
                    value={inspectorCertNumber}
                    onChange={(e) => setInspectorCertNumber(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-lg border font-mono ${inputBg}`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <label htmlFor="rt-rpt-gov" className="block font-bold">
                  {isAr ? 'الكود الحاكم في التقرير:' : 'Report Governing Code:'}
                </label>
                <select
                  id="rt-rpt-gov"
                  data-testid="rt-report-governing-select"
                  value={governingCodeId}
                  onChange={(e) =>
                    handleSelectGovCode(e.target.value as ArRtAcceptanceCodeId)
                  }
                  className={`w-full px-3 py-2 rounded-lg border font-bold ${inputBg}`}
                >
                  {AR_RT_ACCEPTANCE_CODES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shortCode} — {c.title[language]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="rt-rpt-disp" className="block font-bold">
                  {isAr ? 'القرار النهائي بالريبورت:' : 'Final Report Disposition:'}
                </label>
                <select
                  id="rt-rpt-disp"
                  data-testid="rt-report-disposition-select"
                  value={finalDisposition}
                  onChange={(e) =>
                    setManualDispositionOverride(e.target.value as RtFilmDisposition)
                  }
                  className={`w-full px-3 py-2 rounded-lg border font-bold ${inputBg}`}
                >
                  <option value="ACCEPTED">
                    {isAr ? 'مقبول (ACCEPTED)' : 'ACCEPTED'}
                  </option>
                  <option value="REJECTED_REPAIR">
                    {isAr ? 'مرفوض — يلزم إصلاح (REJECTED)' : 'REJECTED — REPAIR REQUIRED'}
                  </option>
                  <option value="RESHOOT_REQUIRED">
                    {isAr ? 'إعادة تصوير الفيلم (RESHOOT QC)' : 'RESHOOT REQUIRED (QC)'}
                  </option>
                </select>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <label htmlFor="rt-rpt-comments" className="block font-bold">
                {isAr ? 'توصيات وملاحظات المفتش الهندسية:' : 'Inspector Technical Remarks:'}
              </label>
              <textarea
                id="rt-rpt-comments"
                rows={2}
                value={inspectorComments}
                onChange={(e) => setInspectorComments(e.target.value)}
                placeholder={
                  isAr
                    ? 'اكتب أي توصيات خاصة باللحام أو إعادة الفحص أو مراجعة Level III...'
                    : 'Enter repair instructions, re-shot requirements, or Level III disposition notes...'
                }
                className={`w-full px-3 py-2 rounded-lg border ${inputBg}`}
              />
            </div>

            <VirtualSignaturePad
              language={language}
              inspectorName={inspectorName}
              onSignatureChange={setSignatureDataUrl}
            />

            {/* Export Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                type="button"
                data-testid="rt-workbench-export-pdf"
                onClick={() => handleExportPdf()}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تحميل تقرير PDF المعتمد' : 'Download Official PDF Report'}</span>
              </button>

              <button
                type="button"
                data-testid="rt-workbench-export-csv"
                onClick={() => handleExportCsv()}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  isLight
                    ? 'bg-white text-slate-800 border-slate-300 hover:border-slate-400'
                    : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-slate-500'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                <span>{isAr ? 'تصدير CSV (7 أكواد)' : 'Export CSV (7 Codes)'}</span>
              </button>

              <button
                type="button"
                data-testid="rt-workbench-save-archive"
                onClick={handleSaveToArchive}
                className={`px-3.5 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-300 hover:bg-cyan-100'
                    : 'bg-cyan-950/50 text-cyan-300 border-cyan-500/40 hover:bg-cyan-900/50'
                }`}
              >
                <Archive className="w-4 h-4" />
                <span>{isAr ? 'حفظ في الأرشيف' : 'Save to Archive'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    window.print();
                  } catch {
                    // Ignore in JSDOM
                  }
                }}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isAr ? 'طباعة' : 'Print'}</span>
              </button>
            </div>

            {exportBanner && (
              <div
                data-testid="rt-workbench-export-status"
                className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-bold text-emerald-500 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>{exportBanner}</span>
              </div>
            )}
          </div>

          {/* Right 5 cols: Live Report Preview Sheet */}
          <div
            data-testid="rt-report-live-preview"
            className="lg:col-span-5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white text-slate-900 p-5 space-y-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  INSCO NDT · RT FILM INTERPRETATION REPORT
                </div>
                <div className="text-sm font-black mt-0.5 font-mono">{reportNumber}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {inspectionDate} · {activeGovCodeMeta.shortCode}
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-black text-white ${
                  finalDisposition === 'ACCEPTED'
                    ? 'bg-emerald-600'
                    : finalDisposition === 'RESHOOT_REQUIRED'
                    ? 'bg-amber-600'
                    : 'bg-rose-600'
                }`}
              >
                {finalDisposition === 'ACCEPTED'
                  ? 'ACCEPTED'
                  : finalDisposition === 'RESHOOT_REQUIRED'
                  ? 'RESHOOT'
                  : 'REJECTED'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono tabular-nums">
              <div>
                <span className="text-slate-500">Client:</span>{' '}
                <strong>{clientName}</strong>
              </div>
              <div>
                <span className="text-slate-500">Joint:</span>{' '}
                <strong>{specimen.weldTag}</strong>
              </div>
              <div>
                <span className="text-slate-500">Source:</span>{' '}
                <strong>
                  {source.shortCode} ({technique.shortCode})
                </strong>
              </div>
              <div>
                <span className="text-slate-500">QC:</span>{' '}
                <strong>
                  H&D {filmEval.weldMetalDensity} · IQI {filmEval.visibleWiresCount}/6
                </strong>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2.5 space-y-1.5">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-500">
                Indications ({effectiveIndicationsForMatrix.length})
              </div>
              {effectiveIndicationsForMatrix.map((ind) => {
                const gov = ind.verdicts.find((v) => v.codeId === governingCodeId);
                return (
                  <div
                    key={ind.id}
                    className="flex items-center justify-between gap-2 text-[11px] font-mono py-1 border-b border-slate-100"
                  >
                    <span className="truncate font-bold">
                      [{ind.filmSegment}] {isAr ? ind.defectNameAr : ind.defectNameEn}
                    </span>
                    <span className="shrink-0">
                      {ind.lengthMm} mm ·{' '}
                      <strong
                        className={
                          gov?.verdict === 'REJECT' ? 'text-rose-600' : 'text-emerald-600'
                        }
                      >
                        {gov?.verdict ?? 'ACCEPT'}
                      </strong>
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-200 pt-2.5 space-y-1">
              <div className="text-[10px] font-mono font-bold uppercase text-slate-500">
                7-Code Compliance Snapshot
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                {allCodesAggregate.map((c) => (
                  <div key={c.codeId} className="flex items-center justify-between pr-1">
                    <span className="truncate">{c.shortCode}</span>
                    <span
                      className={`font-bold ${
                        c.verdict === 'ACCEPT' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {c.verdict}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-2.5 flex items-end justify-between gap-2 text-[11px]">
              <div>
                <div className="font-bold">{inspectorName}</div>
                <div className="text-[10px] font-mono text-slate-500">
                  {inspectorLevel} · {inspectorCertNumber}
                </div>
              </div>
              {signatureDataUrl && (
                <img
                  src={signatureDataUrl}
                  alt="Inspector digital signature"
                  className="h-10 max-w-[130px] object-contain border border-slate-200 rounded bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 4: ARCHIVED REPORTS LOG                                       */}
      {/* ================================================================= */}
      {activeTab === 'archive' && (
        <div
          data-testid="rt-workbench-archive-list"
          className={`rounded-xl border overflow-hidden ${subCardBg}`}
        >
          {archivedReports.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              {isAr
                ? 'لا توجد تقارير محفوظة في الأرشيف بعد — افتح تبويب "إصدار التقرير والتوقيع" واضغط "حفظ في الأرشيف".'
                : 'No archived RT reports yet — open the "Report & Sign-Off" tab and click "Save to Archive".'}
            </div>
          ) : (
            <div className="divide-y divide-slate-700/20">
              {archivedReports.map((rep) => (
                <div
                  key={rep.reportNumber}
                  className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-mono font-black flex items-center gap-2">
                      <span>{rep.reportNumber}</span>
                      <span
                        className={
                          rep.finalDisposition === 'ACCEPTED'
                            ? 'text-emerald-500'
                            : rep.finalDisposition === 'RESHOOT_REQUIRED'
                            ? 'text-amber-500'
                            : 'text-rose-500'
                        }
                      >
                        · {rep.finalDisposition}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5 tabular-nums">
                      {rep.inspectionDate} · {rep.weldJointId} · {rep.governingCodeLabel} ·{' '}
                      {rep.indications.length} {isAr ? 'مؤشر' : 'indication(s)'} ·{' '}
                      {rep.inspectorName}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleLoadArchived(rep)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer ${
                        isLight
                          ? 'bg-white text-slate-700 border-slate-300'
                          : 'bg-slate-900 text-slate-200 border-slate-700'
                      }`}
                    >
                      {isAr ? 'فتح بالتقرير' : 'Load'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportPdf(rep)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-bold cursor-pointer"
                    >
                      PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportCsv(rep)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold cursor-pointer ${
                        isLight
                          ? 'bg-white text-slate-700 border-slate-300'
                          : 'bg-slate-900 text-slate-200 border-slate-700'
                      }`}
                    >
                      CSV
                    </button>
                    <button
                      type="button"
                      aria-label={isAr ? 'حذف التقرير' : 'Delete report'}
                      onClick={() => handleDeleteArchived(rep.reportNumber)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
