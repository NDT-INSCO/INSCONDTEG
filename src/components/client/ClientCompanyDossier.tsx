import React, { useEffect, useMemo, useState } from 'react';
import {
  MapPin,
  Archive,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Plus,
  QrCode,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import type { Language } from '../../types';
import {
  generateNextBadgeCode,
  generateNextReportNumber,
  sanitizeReportNumber,
  type ArchiveCategory,
  type AttendanceLog,
  type CompanyEmployee,
  type CompanyInspectionReport,
  type CompanyRecord,
  type NdtReportMethod,
  type ReportCustomFieldRow,
  type ReportStatus,
  type ReportVerdict,
  type TechnicalDataPayload,
} from '../../client/types';
import { getReportTemplate, REPORT_TEMPLATES } from '../../client/reportTemplates';
import { exportCompanyInspectionReportPdf } from '../../client/reportPdf';
import {
  buildCompanyDossierUrl,
  exportCompanyQrPassPdf,
  generateCompanyQrPngDataUrl,
} from '../../client/companyQr';
import {
  createCompanyEmployee,
  createCompanyReport,
  deleteCompanyReport,
  updateCompanyRecord,
  updateCompanyReportStatus,
} from '../../client/firestoreClientService';
import { resolveSiteCoordinates } from '../../client/geofencing';
import { filterReportsForCompany } from '../../client/reportGrouping';
import {
  clearRecentDownloadedReports,
  loadRecentDownloadedReports,
  recordRecentDownloadedReport,
  type RecentDownloadedReportEntry,
} from '../../client/recentReports';
import { CompanyQrBadge } from './CompanyQrBadge';
import { CompanyQrModal } from './CompanyQrModal';
import { ClientReportDossierView } from './ClientReportDossierView';
import { RecentReportsPanel } from './RecentReportsPanel';
import { EmployeeMapTracker } from './EmployeeMapTracker';
import { EmployeeAttendanceTimeline } from './EmployeeAttendanceTimeline';

interface ClientCompanyDossierProps {
  language: Language;
  company: CompanyRecord;
  reports: CompanyInspectionReport[];
  employees?: CompanyEmployee[];
  attendanceLogs?: AttendanceLog[];
  reportsLoading?: boolean;
  isAdmin: boolean;
  currentUid: string;
  onBackToArchive: () => void;
  onExportPdf?: (company: CompanyRecord, report: CompanyInspectionReport) => unknown;
  onRequestEmployeeLocationUpdate?: (employee: CompanyEmployee) => void;
  isUpdatingEmployeeLocation?: boolean;
  onOpenTimeClock?: () => void;
}

type DossierTab = 'archive' | 'workforce' | 'builder' | 'profile';

const VERDICT_OPTIONS: ReportVerdict[] = ['ACCEPT', 'REJECT', 'HOLD', 'REVIEW'];

export const ClientCompanyDossier: React.FC<ClientCompanyDossierProps> = ({
  language,
  company,
  reports,
  employees = [],
  attendanceLogs = [],
  reportsLoading = false,
  isAdmin,
  currentUid,
  onBackToArchive,
  onExportPdf = exportCompanyInspectionReportPdf,
  onRequestEmployeeLocationUpdate,
  isUpdatingEmployeeLocation = false,
  onOpenTimeClock,
}) => {
  const isAr = language === 'ar';
  const BackIcon = isAr ? ArrowRight : ArrowLeft;
  const canManageCompany =
    isAdmin ||
    (Boolean(currentUid) &&
      company.createdByUid === currentUid &&
      company.assignedClientUid === currentUid);

  const [activeTab, setActiveTab] = useState<DossierTab>('archive');
  const [previewReport, setPreviewReport] = useState<CompanyInspectionReport | null>(null);
  const [actionBanner, setActionBanner] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedQrUrl, setCopiedQrUrl] = useState(false);
  const [downloadingQrPng, setDownloadingQrPng] = useState(false);
  const [recentDownloads, setRecentDownloads] = useState<RecentDownloadedReportEntry[]>(() =>
    loadRecentDownloadedReports(company.id)
  );

  useEffect(() => {
    setRecentDownloads(loadRecentDownloadedReports(company.id));
  }, [company.id]);

  const trackDownloadedReport = (report: CompanyInspectionReport) => {
    setRecentDownloads(recordRecentDownloadedReport(company.id, report));
  };

  const handleDownloadAndTrackReport = (report: CompanyInspectionReport) => {
    onExportPdf(company, report);
    trackDownloadedReport(report);
  };

  // Builder state
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('rt_weld_v1');
  const activeTemplate = useMemo(
    () => getReportTemplate(selectedTemplateKey),
    [selectedTemplateKey]
  );

  const [reportNumber, setReportNumber] = useState(() =>
    generateNextReportNumber(
      company.companyCode,
      'RT',
      reports.map(r => r.reportNumber)
    )
  );
  const [method, setMethod] = useState<NdtReportMethod>('RT');
  const [isLegacyArchive, setIsLegacyArchive] = useState(false);
  const [projectName, setProjectName] = useState(company.nameEn);
  const [clientPoNumber, setClientPoNumber] = useState('');
  const [componentOrJointId, setComponentOrJointId] = useState('');
  const [materialSpec, setMaterialSpec] = useState('ASTM A106 Gr.B');
  const [thicknessMm, setThicknessMm] = useState('18.5');
  const [codeStandard, setCodeStandard] = useState(activeTemplate.defaultCodeStandard);
  const [inspectorName, setInspectorName] = useState('');
  const [inspectionDate, setInspectionDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [verdict, setVerdict] = useState<ReportVerdict>('ACCEPT');
  const [reportStatus, setReportStatus] = useState<ReportStatus>('issued');
  const [techFields, setTechFields] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of activeTemplate.fields) {
      if (f.defaultValue) initial[f.key] = f.defaultValue;
    }
    return initial;
  });
  const [customRows, setCustomRows] = useState<ReportCustomFieldRow[]>([
    { label: '', value: '', unit: '' },
  ]);
  const [notes, setNotes] = useState('');

  // Company profile & geofence edit state
  const siteDefaults = useMemo(() => resolveSiteCoordinates(company), [company]);
  const [editCategory, setEditCategory] = useState<ArchiveCategory>(company.archiveCategory);
  const [editActiveTesting, setEditActiveTesting] = useState(company.hasActiveTestingDossier);
  const [editScope, setEditScope] = useState(company.activeScope || '');
  const [editContactPerson, setEditContactPerson] = useState(company.contactPerson || '');
  const [editContactPhone, setEditContactPhone] = useState(company.contactPhone || '');
  const [editSiteLat, setEditSiteLat] = useState(String(siteDefaults.lat));
  const [editSiteLng, setEditSiteLng] = useState(String(siteDefaults.lng));
  const [editGeofenceRadius, setEditGeofenceRadius] = useState(
    String(siteDefaults.geofenceRadiusMeters)
  );

  // Workforce employee enrollment state
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('NDT Field Inspector');
  const [empBadge, setEmpBadge] = useState(() =>
    generateNextBadgeCode(employees.map(e => e.badgeCode))
  );
  const [empPhone, setEmpPhone] = useState('');
  const [addingEmployee, setAddingEmployee] = useState(false);

  const handleSelectTemplate = (templateKey: string) => {
    const tpl = getReportTemplate(templateKey);
    setSelectedTemplateKey(tpl.templateKey);
    setMethod(tpl.method);
    setCodeStandard(tpl.defaultCodeStandard);
    setReportNumber(
      generateNextReportNumber(
        company.companyCode,
        tpl.method,
        reports.map(r => r.reportNumber)
      )
    );
    const defaults: Record<string, string> = {};
    for (const f of tpl.fields) {
      if (f.defaultValue) defaults[f.key] = f.defaultValue;
    }
    setTechFields(defaults);
  };

  const companyReports = useMemo(
    () => filterReportsForCompany(reports, company.id),
    [reports, company.id]
  );

  const legacyCount = useMemo(
    () => companyReports.filter(r => r.isLegacyArchive).length,
    [companyReports]
  );
  const issuedNewCount = useMemo(
    () => companyReports.filter(r => !r.isLegacyArchive).length,
    [companyReports]
  );

  const handleSaveReport = async (alsoDownloadPdf: boolean) => {
    setFormError(null);
    const cleanReportNo = sanitizeReportNumber(reportNumber);
    if (cleanReportNo.length < 3) {
      setFormError(isAr ? 'يرجى إدخال رقم تقرير صالح.' : 'Please enter a valid report number.');
      return;
    }
    if (!projectName.trim() || !componentOrJointId.trim() || !inspectorName.trim()) {
      setFormError(
        isAr
          ? 'يرجى استيفاء اسم المشروع، ومعرّف الوصلة/المعدة، واسم المفتش.'
          : 'Please complete Project Name, Joint/Component ID, and Inspector Name.'
      );
      return;
    }

    const technicalData: TechnicalDataPayload = {
      ...techFields,
      customFields: customRows.filter(row => row.label.trim().length > 0),
    };

    setSaving(true);
    try {
      const createdId = await createCompanyReport(currentUid, company, {
        reportNumber: cleanReportNo,
        templateKey: selectedTemplateKey,
        method,
        isLegacyArchive,
        projectName: projectName.trim(),
        clientPoNumber: clientPoNumber.trim(),
        componentOrJointId: componentOrJointId.trim(),
        materialSpec: materialSpec.trim(),
        thicknessMm: thicknessMm.trim(),
        codeStandard: codeStandard.trim(),
        inspectorName: inspectorName.trim(),
        inspectionDate,
        verdict,
        status: isLegacyArchive ? 'archived' : reportStatus,
        technicalData,
        notes: notes.trim(),
      });

      if (alsoDownloadPdf) {
        const exportedReport: CompanyInspectionReport = {
          id: createdId,
          companyId: company.id,
          companyCode: company.companyCode,
          assignedClientUid: company.assignedClientUid,
          reportNumber: cleanReportNo,
          templateKey: selectedTemplateKey,
          method,
          isLegacyArchive,
          projectName: projectName.trim(),
          clientPoNumber: clientPoNumber.trim(),
          componentOrJointId: componentOrJointId.trim(),
          materialSpec: materialSpec.trim(),
          thicknessMm: thicknessMm.trim(),
          codeStandard: codeStandard.trim(),
          inspectorName: inspectorName.trim(),
          inspectionDate,
          verdict,
          status: isLegacyArchive ? 'archived' : reportStatus,
          technicalData,
          notes: notes.trim(),
          createdByUid: currentUid,
        };
        handleDownloadAndTrackReport(exportedReport);
      }

      setActionBanner(
        isAr
          ? `تم حفظ التقرير ${cleanReportNo} في ملف الشركة ${company.companyCode}`
          : `Report ${cleanReportNo} saved to dossier ${company.companyCode}`
      );
      setComponentOrJointId('');
      setNotes('');
      setReportNumber(
        generateNextReportNumber(company.companyCode, method, [
          ...reports.map(r => r.reportNumber),
          cleanReportNo,
        ])
      );
      setActiveTab('archive');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const parsedLat = Number.parseFloat(editSiteLat);
    const parsedLng = Number.parseFloat(editSiteLng);
    const parsedRadius = Number.parseInt(editGeofenceRadius, 10);
    try {
      await updateCompanyRecord(company.id, {
        archiveCategory: editCategory,
        hasActiveTestingDossier: editActiveTesting,
        activeScope: editScope,
        contactPerson: editContactPerson,
        contactPhone: editContactPhone,
        ...(Number.isFinite(parsedLat) && { siteLat: parsedLat }),
        ...(Number.isFinite(parsedLng) && { siteLng: parsedLng }),
        ...(Number.isFinite(parsedRadius) && { geofenceRadiusMeters: parsedRadius }),
      });
      setActionBanner(
        isAr ? 'تم تحديث إعدادات ملف الشركة والسياج الجغرافي بنجاح.' : 'Company dossier & geofence settings updated.'
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim()) return;
    setAddingEmployee(true);
    setFormError(null);
    try {
      const created = await createCompanyEmployee(currentUid, company, {
        fullName: empName.trim(),
        roleTitle: empRole.trim() || 'Field Technician',
        badgeCode: empBadge.trim() || generateNextBadgeCode(employees.map(emp => emp.badgeCode)),
        phone: empPhone.trim(),
        lastLat: siteDefaults.lat,
        lastLng: siteDefaults.lng,
      });
      setEmpName('');
      setEmpPhone('');
      setEmpBadge(generateNextBadgeCode([...employees.map(emp => emp.badgeCode), created.badgeCode]));
      setActionBanner(
        isAr
          ? `تم إضافة الفني ${created.fullName} (${created.badgeCode}) إلى سجل الشركة.`
          : `Added technician ${created.fullName} (${created.badgeCode}) to company roster.`
      );
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setAddingEmployee(false);
    }
  };

  return (
    <div className="space-y-5" data-testid="company-dossier-view">
      {/* Top Breadcrumb + Back */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToArchive}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition cursor-pointer whitespace-nowrap"
        >
          <BackIcon className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{isAr ? 'العودة إلى أرشيف الشركات' : 'Back to Companies Archive'}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-1.5 text-xs font-bold text-emerald-300 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'QR البطاقة الميدانية' : 'Field QR Pass'}</span>
          </button>

          {canManageCompany && (
            <button
              type="button"
              onClick={() => setActiveTab('builder')}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 text-xs font-black text-slate-950 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <FilePlus2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'إدخال بيانات تقرير جديد' : 'Create New Report'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Company Dossier Header Card */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-0.5 font-bold text-cyan-300">
                <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
                {company.companyCode}
              </span>
              <span
                className={`rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                  company.hasActiveTestingDossier
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-slate-700 bg-slate-800 text-slate-300'
                }`}
              >
                {company.hasActiveTestingDossier
                  ? isAr
                    ? 'شركة قيد الاختبار (فايل نشط)'
                    : 'Active Testing Dossier'
                  : isAr
                    ? 'ملف أرشيف'
                    : 'Archived File'}
              </span>
              <span className="text-slate-400">ID: {company.id}</span>
              {company.legacySinceYear && (
                <>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="text-slate-400">
                    {isAr ? `عميل منذ ${company.legacySinceYear}` : `Since ${company.legacySinceYear}`}
                  </span>
                </>
              )}
            </div>

            <h2 className="text-xl font-black text-white">
              {isAr ? company.nameAr : company.nameEn}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? company.nameEn : company.nameAr} · {company.sector}
              {company.projectLocation ? ` · ${company.projectLocation}` : ''}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3.5 py-2.5 text-center">
              <div className="text-lg font-black text-white tabular-nums font-mono">
                {reports.length}
              </div>
              <div className="text-[11px] text-slate-400 whitespace-nowrap">
                {isAr ? 'إجمالي التقارير' : 'Total Reports'}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3.5 py-2.5 text-center">
              <div className="text-lg font-black text-emerald-400 tabular-nums font-mono">
                {issuedNewCount}
              </div>
              <div className="text-[11px] text-slate-400 whitespace-nowrap">
                {isAr ? 'تقارير جديدة' : 'New Entries'}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3.5 py-2.5 text-center">
              <div className="text-lg font-black text-amber-400 tabular-nums font-mono">
                {legacyCount}
              </div>
              <div className="text-[11px] text-slate-400 whitespace-nowrap">
                {isAr ? 'أرشيف قديم' : 'Legacy Archive'}
              </div>
            </div>
          </div>
        </div>

        {company.activeScope && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3.5 py-2.5 text-xs text-slate-300">
            <span className="font-mono text-cyan-400 font-semibold">
              {isAr ? 'نطاق الاختبارات: ' : 'Testing Scope: '}
            </span>
            {company.activeScope}
          </div>
        )}

        {/* Dossier Internal Tabs */}
        <div
          role="tablist"
          aria-label={isAr ? 'أقسام ملف الشركة' : 'Company Dossier Tabs'}
          className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'archive'}
            onClick={() => setActiveTab('archive')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'archive'
                ? 'bg-cyan-600 text-white'
                : 'border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Archive className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'أرشيف وسجل الريبورتات' : 'Reports Archive'}</span>
            <span className="font-mono tabular-nums opacity-80">({reports.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'workforce'}
            onClick={() => setActiveTab('workforce')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'workforce'
                ? 'bg-cyan-600 text-white'
                : 'border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'خريطة الموظفين والحضور' : 'Crew Map & Timeline'}</span>
            <span className="font-mono tabular-nums opacity-80">({employees.length})</span>
          </button>

          {canManageCompany && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'builder'}
              onClick={() => setActiveTab('builder')}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                activeTab === 'builder'
                  ? 'bg-cyan-600 text-white'
                  : 'border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {isAr
                  ? 'آلية إدخال بيانات الريبورتات الجديدة'
                  : 'New Report Data-Entry Builder'}
              </span>
            </button>
          )}

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-cyan-600 text-white'
                : 'border border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'بيانات الشركة وربط الملف' : 'Company Profile & Scope'}</span>
          </button>
        </div>
      </div>

      {actionBanner && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            {actionBanner}
          </span>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="text-emerald-200 hover:text-white cursor-pointer"
            aria-label={isAr ? 'إغلاق الإشعار' : 'Dismiss'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TAB 1: REPORTS ARCHIVE & DATE-CATEGORIZED DOSSIER + RECENT REPORTS + LIVE MAP TRACKER */}
      {activeTab === 'archive' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
            <div className="xl:col-span-9 min-w-0">
              <ClientReportDossierView
                language={language}
                company={company}
                reports={companyReports}
                loading={reportsLoading}
                isAdmin={canManageCompany}
                onPreviewReport={setPreviewReport}
                onReportDownloaded={trackDownloadedReport}
                onExportPdf={onExportPdf}
                onArchiveReport={rep =>
                  void updateCompanyReportStatus(company.id, rep.id, {
                    status: 'archived',
                    verdict: rep.verdict,
                    notes: rep.notes,
                  })
                }
                onDeleteReport={rep => void deleteCompanyReport(company.id, rep.id)}
                onOpenBuilder={() => setActiveTab('builder')}
              />
            </div>

            <div className="xl:col-span-3 xl:sticky xl:top-4">
              <RecentReportsPanel
                language={language}
                entries={recentDownloads}
                companyReports={companyReports}
                onRedownload={handleDownloadAndTrackReport}
                onPreviewReport={setPreviewReport}
                onClearRecent={() => setRecentDownloads(clearRecentDownloadedReports(company.id))}
              />
            </div>
          </div>

          <EmployeeMapTracker
            language={language}
            company={company}
            employees={employees}
            attendanceLogs={attendanceLogs}
            onRequestLocationUpdate={onRequestEmployeeLocationUpdate}
            isUpdatingLocation={isUpdatingEmployeeLocation}
          />
        </div>
      )}

      {/* TAB 1b: CREW MAP TRACKER, EMPLOYEE ROSTER & ATTENDANCE TIMELINE */}
      {activeTab === 'workforce' && (
        <div className="space-y-5" data-testid="company-workforce-tab">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
            <div className="text-xs text-slate-300">
              {isAr
                ? `إدارة فريق العمل الميداني وتنبيهات السياج الجغرافي للشركة ${company.companyCode}`
                : `Field crew tracking, biometric check-ins, and geofencing timeline for ${company.companyCode}`}
            </div>
            {onOpenTimeClock && (
              <button
                type="button"
                onClick={onOpenTimeClock}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white cursor-pointer whitespace-nowrap"
              >
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAr ? 'فتح بوابة تسجيل حضور الأفراد' : 'Open Worker Time-Clock'}</span>
              </button>
            )}
          </div>

          {canManageCompany && (
            <form
              onSubmit={handleAddEmployee}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
            >
              <div className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4" aria-hidden="true" />
                <span>{isAr ? 'إضافة فني / موظف ميداني إلى هذا المشروع' : 'Enroll Technician / Employee'}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={e => setEmpName(e.target.value)}
                  placeholder={isAr ? 'الاسم الكامل *' : 'Full Name *'}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  required
                  value={empRole}
                  onChange={e => setEmpRole(e.target.value)}
                  placeholder={isAr ? 'التخصص / الدور' : 'Role / Discipline'}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
                />
                <input
                  type="text"
                  required
                  value={empBadge}
                  onChange={e => setEmpBadge(e.target.value.toUpperCase())}
                  placeholder="EMP-101"
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-cyan-300"
                />
                <button
                  type="submit"
                  disabled={addingEmployee}
                  className="rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 cursor-pointer"
                >
                  {addingEmployee ? (isAr ? 'جاري التسجيل...' : 'Saving...') : isAr ? 'تسجيل الفني' : 'Add Employee'}
                </button>
              </div>
            </form>
          )}

          <EmployeeMapTracker
            language={language}
            company={company}
            employees={employees}
            attendanceLogs={attendanceLogs}
            onRequestLocationUpdate={onRequestEmployeeLocationUpdate}
            isUpdatingLocation={isUpdatingEmployeeLocation}
          />

          <EmployeeAttendanceTimeline
            language={language}
            logs={attendanceLogs}
            companyName={isAr ? company.nameAr : company.nameEn}
            companyCode={company.companyCode}
          />
        </div>
      )}

      {/* TAB 2: NEW REPORT DATA-ENTRY BUILDER */}
      {activeTab === 'builder' && canManageCompany && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-white">
                {isAr
                  ? 'آلية إدخال بيانات الريبورتات الهندسية الجديدة وأرشفتها'
                  : 'Structured Report Data-Entry & Template Engine'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'نظام قوالب معياري مرن جاهز لإدخال التقارير فوراً، وقابل لتركيب تصميمات الريبورتات الخاصة بكم مباشرةً.'
                  : 'Modular template engine ready for immediate NDT/PWHT report entry and pluggable custom report layouts.'}
              </p>
            </div>
            <div className="font-mono text-xs text-cyan-400 tabular-nums">
              {isAr ? `كود الشركة: ${company.companyCode}` : `Company Code: ${company.companyCode}`}
            </div>
          </div>

          {/* Template Selector */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-300">
              {isAr ? '1. اختر قالب ونوع التقرير:' : '1. Select Report Template & Discipline:'}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {REPORT_TEMPLATES.map(tpl => {
                const selected = tpl.templateKey === selectedTemplateKey;
                return (
                  <button
                    key={tpl.templateKey}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl.templateKey)}
                    className={`text-start rounded-lg border p-3 transition cursor-pointer ${
                      selected
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs font-mono font-bold">
                      <span className="text-cyan-400">{tpl.method}</span>
                      <span className="text-[10px] text-slate-500">{tpl.templateKey}</span>
                    </div>
                    <div className="mt-1 text-xs font-bold text-white">
                      {isAr ? tpl.titleAr : tpl.titleEn}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-400 line-clamp-1">
                      {isAr ? tpl.subtitleAr : tpl.subtitleEn}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* General Report Identification Fields */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300">
              {isAr ? '2. البيانات التعريفية للريبورت والعينة:' : '2. Report Header & Specimen Identification:'}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="space-y-1 text-xs">
                <span className="text-slate-400 block">{isAr ? 'رقم الريبورت (Report No.) *' : 'Report Number *'}</span>
                <input
                  type="text"
                  value={reportNumber}
                  onChange={e => setReportNumber(sanitizeReportNumber(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-cyan-300 focus:border-cyan-500 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="text-slate-400 block">{isAr ? 'اسم المشروع / أمر العمل *' : 'Project / Work Order *'}</span>
                <input
                  type="text"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="text-slate-400 block">{isAr ? 'رقم أمر الشراء PO' : 'Client PO / Contract Ref'}</span>
                <input
                  type="text"
                  value={clientPoNumber}
                  onChange={e => setClientPoNumber(e.target.value)}
                  placeholder="PO-2026-..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="text-slate-400 block">{isAr ? 'معرّف الوصلة / خط اللحام *' : 'Weld / Joint / Tag ID *'}</span>
                <input
                  type="text"
                  value={componentOrJointId}
                  onChange={e => setComponentOrJointId(e.target.value)}
                  placeholder="LINE-102-JW08"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="text-slate-400 block">{isAr ? 'خامة المعدن' : 'Material Specification'}</span>
                <input
                  type="text"
                  value={materialSpec}
                  onChange={e => setMaterialSpec(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="text-slate-400 block">{isAr ? 'السماكة (mm)' : 'Thickness (mm)'}</span>
                <input
                  type="text"
                  value={thicknessMm}
                  onChange={e => setThicknessMm(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="text-slate-400 block">{isAr ? 'الكود والمعيار المرجعي *' : 'Governing Code Standard *'}</span>
                <input
                  type="text"
                  value={codeStandard}
                  onChange={e => setCodeStandard(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="text-slate-400 block">{isAr ? 'اسم المفتش / المهندس *' : 'Inspector / Engineer *'}</span>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={e => setInspectorName(e.target.value)}
                  placeholder={isAr ? 'م. ... (NDT Level II/III)' : 'Eng. ... (NDT Level II/III)'}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </label>

              <label className="space-y-1 text-xs">
                <span className="text-slate-400 block">{isAr ? 'تاريخ الفحص *' : 'Inspection Date *'}</span>
                <input
                  type="date"
                  value={inspectionDate}
                  onChange={e => setInspectionDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
              </label>
            </div>
          </div>

          {/* Method-Specific Technical Fields */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300">
              {isAr
                ? `3. المعايير الفنية لقالب (${activeTemplate.method}):`
                : `3. Technical Parameters (${activeTemplate.method}):`}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeTemplate.fields.map(field => (
                <label key={field.key} className="space-y-1 text-xs">
                  <span className="text-slate-400 block">
                    {isAr ? field.labelAr : field.labelEn}
                    {field.unit ? ` (${field.unit})` : ''}
                  </span>
                  {field.type === 'select' && field.options ? (
                    <select
                      value={techFields[field.key] ?? field.defaultValue ?? ''}
                      onChange={e =>
                        setTechFields(prev => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    >
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={techFields[field.key] ?? ''}
                      onChange={e =>
                        setTechFields(prev => ({ ...prev, [field.key]: e.target.value }))
                      }
                      placeholder={isAr ? field.placeholderAr : field.placeholderEn}
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Extensible Custom Rows */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-300">
                {isAr
                  ? '4. حقول مخصصة إضافية (مرنة لأي تصميم تقرير):'
                  : '4. Custom Technical Rows (Extensible for Any Report Design):'}
              </div>
              <button
                type="button"
                onClick={() =>
                  setCustomRows(prev =>
                    prev.length >= 12 ? prev : [...prev, { label: '', value: '', unit: '' }]
                  )
                }
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-slate-800 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{isAr ? 'إضافة صف قياس' : 'Add Field Row'}</span>
              </button>
            </div>
            <div className="space-y-2">
              {customRows.map((row, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={row.label}
                    onChange={e =>
                      setCustomRows(prev =>
                        prev.map((r, i) => (i === idx ? { ...r, label: e.target.value } : r))
                      )
                    }
                    placeholder={isAr ? 'اسم البند / القياس' : 'Field Label'}
                    className="sm:col-span-5 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={row.value}
                    onChange={e =>
                      setCustomRows(prev =>
                        prev.map((r, i) => (i === idx ? { ...r, value: e.target.value } : r))
                      )
                    }
                    placeholder={isAr ? 'القيمة / النتيجة' : 'Measured Value'}
                    className="sm:col-span-4 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={row.unit || ''}
                    onChange={e =>
                      setCustomRows(prev =>
                        prev.map((r, i) => (i === idx ? { ...r, unit: e.target.value } : r))
                      )
                    }
                    placeholder={isAr ? 'الوحدة' : 'Unit'}
                    className="sm:col-span-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setCustomRows(prev =>
                        prev.length > 1 ? prev.filter((_, i) => i !== idx) : [{ label: '', value: '', unit: '' }]
                      )
                    }
                    aria-label={isAr ? 'حذف الصف' : 'Remove row'}
                    className="sm:col-span-1 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Outcome, Archive Classification & Notes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-800 pt-4">
            <label className="space-y-1 text-xs">
              <span className="text-slate-400 block">{isAr ? 'القرار الكودي النهائي' : 'Final Verdict'}</span>
              <select
                value={verdict}
                onChange={e => setVerdict(e.target.value as ReportVerdict)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white"
              >
                {VERDICT_OPTIONS.map(v => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-xs">
              <span className="text-slate-400 block">{isAr ? 'حالة الريبورت' : 'Report Status'}</span>
              <select
                value={isLegacyArchive ? 'archived' : reportStatus}
                disabled={isLegacyArchive}
                onChange={e => setReportStatus(e.target.value as ReportStatus)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white disabled:opacity-60"
              >
                <option value="issued">{isAr ? 'مُصدر ومعتمد (Issued)' : 'Issued'}</option>
                <option value="draft">{isAr ? 'مسودة (Draft)' : 'Draft'}</option>
                <option value="archived">{isAr ? 'مؤرشف (Archived)' : 'Archived'}</option>
              </select>
            </label>

            <div className="flex items-end">
              <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={isLegacyArchive}
                  onChange={e => setIsLegacyArchive(e.target.checked)}
                  className="accent-amber-500"
                />
                <span>{isAr ? 'تسجيل كتقرير من الأرشيف القديم' : 'Mark as Legacy Archived Report'}</span>
              </label>
            </div>
          </div>

          <label className="block space-y-1 text-xs">
            <span className="text-slate-400 block">{isAr ? 'ملاحظات المفتش والتوصيات' : 'Inspector Remarks & Notes'}</span>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          {formError && (
            <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {formError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSaveReport(false)}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 px-4 py-2.5 text-xs font-bold text-white transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ التقرير في ملف الشركة' : 'Save Report to Dossier'}</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSaveReport(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-60 px-4 py-2.5 text-xs font-black text-slate-950 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{isAr ? 'حفظ وتحميل نسخة PDF' : 'Save & Export PDF'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: COMPANY PROFILE & SCOPE */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div className="text-slate-400">{isAr ? 'الرقم الكودي الفريد للشركة' : 'Unique Company Code'}</div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono font-bold text-cyan-300">
                {company.companyCode}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-slate-400">{isAr ? 'السجل التجاري / الضريبي' : 'Commercial Reg / Tax ID'}</div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-slate-200">
                {company.commercialRegNo || '-'}
              </div>
            </div>

            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'تصنيف الأرشفة' : 'Archive Category'}</span>
              <select
                value={editCategory}
                disabled={!canManageCompany}
                onChange={e => setEditCategory(e.target.value as ArchiveCategory)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white disabled:opacity-70"
              >
                <option value="active_testing">{isAr ? 'شركة قيد الاختبار حالياً' : 'Active Testing'}</option>
                <option value="legacy_archive">{isAr ? 'أرشيف شركات قديمة' : 'Legacy Archive'}</option>
                <option value="new_onboarding">{isAr ? 'شركة جديدة قيد الإعداد' : 'New Onboarding'}</option>
              </select>
            </label>

            <div className="flex items-end">
              <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 w-full cursor-pointer">
                <input
                  type="checkbox"
                  disabled={!canManageCompany}
                  checked={editActiveTesting}
                  onChange={e => setEditActiveTesting(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span>
                  {isAr
                    ? 'تفعيل فايل الاختبارات والتقارير النشطة لهذه الشركة'
                    : 'Enable Active Testing & Reports Dossier'}
                </span>
              </label>
            </div>

            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'مسؤول التواصل' : 'Primary Contact'}</span>
              <input
                type="text"
                disabled={!canManageCompany}
                value={editContactPerson}
                onChange={e => setEditContactPerson(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white disabled:opacity-70"
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'هاتف المتابعة' : 'Contact Phone'}</span>
              <input
                type="text"
                disabled={!canManageCompany}
                value={editContactPhone}
                onChange={e => setEditContactPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white disabled:opacity-70"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'خط عرض المشروع (Lat)' : 'Site Latitude'}</span>
              <input
                type="number"
                step="0.00001"
                disabled={!canManageCompany}
                value={editSiteLat}
                onChange={e => setEditSiteLat(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white disabled:opacity-70"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'خط طول المشروع (Lng)' : 'Site Longitude'}</span>
              <input
                type="number"
                step="0.00001"
                disabled={!canManageCompany}
                value={editSiteLng}
                onChange={e => setEditSiteLng(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white disabled:opacity-70"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'نطاق السياج الجغرافي (متر)' : 'Geofence Radius (m)'}</span>
              <input
                type="number"
                min={50}
                max={50000}
                disabled={!canManageCompany}
                value={editGeofenceRadius}
                onChange={e => setEditGeofenceRadius(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-cyan-300 disabled:opacity-70"
              />
            </label>
          </div>

          <label className="block space-y-1 text-xs">
            <span className="text-slate-400 block">{isAr ? 'نطاق العمل والاختبارات التعاقدية' : 'Testing & Contract Scope'}</span>
            <textarea
              rows={3}
              disabled={!canManageCompany}
              value={editScope}
              onChange={e => setEditScope(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white disabled:opacity-70"
            />
          </label>

          {canManageCompany && (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-4 py-2 text-xs font-bold text-white transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? (isAr ? 'جاري التحديث...' : 'Updating...') : isAr ? 'حفظ تعديلات ملف الشركة' : 'Save Dossier Profile'}</span>
            </button>
          )}

          {/* Embedded Field Inspector QR Access Block */}
          <div className="border-t border-slate-800 pt-5 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <CompanyQrBadge
              companyId={company.id}
              companyName={isAr ? company.nameAr : company.nameEn}
              sizePx={132}
            />
            <div className="flex-1 space-y-2.5 min-w-0">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-emerald-400">
                <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAr ? 'كود QR للوصول الميداني المباشر للمفتشين' : 'Direct Field Inspector QR Access'}</span>
              </div>
              <div className="text-xs text-slate-300 leading-relaxed">
                {isAr
                  ? 'مرتبط مباشرة بالمعرّف الفريد للشركة في قاعدة البيانات:'
                  : 'Bound deterministically to this company’s unique Firestore ID:'}{' '}
                <span className="font-mono font-bold text-cyan-300 tabular-nums">{company.id}</span>
              </div>
              <div
                dir="ltr"
                className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 font-mono text-[11px] text-slate-300 truncate select-all"
              >
                {buildCompanyDossierUrl(company.id)}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    const url = buildCompanyDossierUrl(company.id);
                    void navigator.clipboard?.writeText(url).then(() => {
                      setCopiedQrUrl(true);
                      window.setTimeout(() => setCopiedQrUrl(false), 1800);
                    }).catch(() => {});
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-cyan-300 transition cursor-pointer whitespace-nowrap"
                >
                  {copiedQrUrl ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                      <span>{isAr ? 'تم نسخ الرابط' : 'Copied URL'}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{isAr ? 'نسخ رابط الملف' : 'Copy Dossier URL'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={downloadingQrPng}
                  onClick={() => {
                    setDownloadingQrPng(true);
                    void generateCompanyQrPngDataUrl(company.id, 640)
                      .then(dataUrl => {
                        const a = document.createElement('a');
                        const slug = (company.companyCode || company.id).replace(/[^a-zA-Z0-9_-]/g, '_');
                        a.href = dataUrl;
                        a.download = `INSCO_QR_${slug}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      })
                      .finally(() => setDownloadingQrPng(false));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                  <span>{isAr ? 'تحميل PNG' : 'Download PNG'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportCompanyQrPassPdf(company)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-[11px] font-bold text-amber-300 transition cursor-pointer whitespace-nowrap"
                >
                  <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isAr ? 'طباعة بطاقة QR (PDF)' : 'Printable Pass PDF'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Report Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-700 bg-slate-950 p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="text-[11px] font-mono text-cyan-400">
                  {company.companyCode} · {previewReport.reportNumber}
                </div>
                <h4 className="text-base font-black text-white mt-0.5">
                  {isAr
                    ? getReportTemplate(previewReport.templateKey).titleAr
                    : getReportTemplate(previewReport.templateKey).titleEn}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setPreviewReport(null)}
                aria-label={isAr ? 'إغلاق المعاينة' : 'Close preview'}
                className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400">{isAr ? 'المشروع:' : 'Project:'}</span>{' '}
                <span className="text-white font-semibold">{previewReport.projectName}</span>
              </div>
              <div>
                <span className="text-slate-400">{isAr ? 'الوصلة:' : 'Joint/Tag:'}</span>{' '}
                <span className="text-white font-mono">{previewReport.componentOrJointId}</span>
              </div>
              <div>
                <span className="text-slate-400">{isAr ? 'الكود:' : 'Code:'}</span>{' '}
                <span className="text-white">{previewReport.codeStandard}</span>
              </div>
              <div>
                <span className="text-slate-400">{isAr ? 'المفتش:' : 'Inspector:'}</span>{' '}
                <span className="text-white">{previewReport.inspectorName}</span>
              </div>
              <div>
                <span className="text-slate-400">{isAr ? 'التاريخ:' : 'Date:'}</span>{' '}
                <span className="text-white font-mono tabular-nums">{previewReport.inspectionDate}</span>
              </div>
              <div>
                <span className="text-slate-400">{isAr ? 'النتيجة:' : 'Verdict:'}</span>{' '}
                <span className="font-mono font-bold text-emerald-400">{previewReport.verdict}</span>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 space-y-2">
              <div className="text-[11px] font-mono uppercase text-cyan-400">
                {isAr ? 'البيانات الفنية المسجلة' : 'Recorded Technical Parameters'}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(previewReport.technicalData || {}).map(([key, val]) => {
                  if (key === 'customFields' || val === undefined || val === '') return null;
                  return (
                    <div key={key} className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-1">
                      <span className="text-slate-400 font-mono text-[11px]">{key}</span>
                      <span className="text-slate-100 font-semibold">{String(val)}</span>
                    </div>
                  );
                })}
              </div>
              {Array.isArray(previewReport.technicalData?.customFields) &&
                previewReport.technicalData.customFields.length > 0 && (
                  <div className="pt-2 space-y-1">
                    {previewReport.technicalData.customFields.map((row, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs border-b border-slate-800/50 pb-1">
                        <span className="text-slate-400">{row.label}</span>
                        <span className="text-white font-mono">
                          {row.value} {row.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {previewReport.notes && (
              <div className="text-xs text-slate-300 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
                <div className="text-slate-400 font-semibold mb-1">{isAr ? 'ملاحظات:' : 'Notes:'}</div>
                {previewReport.notes}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleDownloadAndTrackReport(previewReport)}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isAr ? 'تحميل PDF' : 'Download PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showQrModal && (
        <CompanyQrModal
          language={language}
          company={company}
          onClose={() => setShowQrModal(false)}
        />
      )}
    </div>
  );
};
