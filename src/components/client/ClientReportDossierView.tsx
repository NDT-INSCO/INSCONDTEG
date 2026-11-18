import React, { useMemo, useState } from 'react';
import {
  Archive,
  ArrowDownUp,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  FilePlus2,
  Layers,
  RotateCcw,
  Search,
  Trash2,
  UserCheck,
} from 'lucide-react';
import type { Language } from '../../types';
import type { CompanyInspectionReport, CompanyRecord, ReportVerdict } from '../../client/types';
import { getReportTemplate } from '../../client/reportTemplates';
import { exportCompanyInspectionReportPdf } from '../../client/reportPdf';
import {
  extractReportMethodsWithCounts,
  extractReportTechnicians,
  extractReportYears,
  filterCompanyDossierReports,
  filterReportsForCompany,
  groupReportsByDateCategory,
  type DateGroupingMode,
  type DateSortOrder,
} from '../../client/reportGrouping';

interface ClientReportDossierViewProps {
  language: Language;
  company: CompanyRecord;
  reports: CompanyInspectionReport[];
  loading?: boolean;
  isAdmin: boolean;
  onPreviewReport: (report: CompanyInspectionReport) => void;
  onReportDownloaded?: (report: CompanyInspectionReport) => void;
  onExportPdf?: (company: CompanyRecord, report: CompanyInspectionReport) => unknown;
  onArchiveReport?: (report: CompanyInspectionReport) => void;
  onDeleteReport?: (report: CompanyInspectionReport) => void;
  onOpenBuilder?: () => void;
}

export const ClientReportDossierView: React.FC<ClientReportDossierViewProps> = ({
  language,
  company,
  reports,
  loading = false,
  isAdmin,
  onPreviewReport,
  onReportDownloaded,
  onExportPdf = exportCompanyInspectionReportPdf,
  onArchiveReport,
  onDeleteReport,
  onOpenBuilder,
}) => {
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [technicianQuery, setTechnicianQuery] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [originFilter, setOriginFilter] = useState<'all' | 'new' | 'legacy'>('all');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [groupMode, setGroupMode] = useState<DateGroupingMode>('month');
  const [sortOrder, setSortOrder] = useState<DateSortOrder>('desc');
  const [expandedReportIds, setExpandedReportIds] = useState<Record<string, boolean>>({});
  const [downloadedId, setDownloadedId] = useState<string | null>(null);

  // Enforce strict link to the active company ID
  const companyLinkedReports = useMemo(
    () => filterReportsForCompany(reports, company.id),
    [reports, company.id]
  );

  const availableYears = useMemo(
    () => extractReportYears(companyLinkedReports),
    [companyLinkedReports]
  );

  const availableTechnicians = useMemo(
    () => extractReportTechnicians(companyLinkedReports),
    [companyLinkedReports]
  );

  const availableMethods = useMemo(
    () => extractReportMethodsWithCounts(companyLinkedReports),
    [companyLinkedReports]
  );

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      technicianQuery.trim() ||
      selectedTechnician !== 'ALL' ||
      methodFilter !== 'ALL' ||
      originFilter !== 'all' ||
      yearFilter !== 'ALL'
  );

  const resetAllFilters = () => {
    setSearchQuery('');
    setTechnicianQuery('');
    setSelectedTechnician('ALL');
    setMethodFilter('ALL');
    setOriginFilter('all');
    setYearFilter('ALL');
  };

  const filteredReports = useMemo(
    () =>
      filterCompanyDossierReports(companyLinkedReports, company.id, {
        searchQuery,
        technicianQuery,
        selectedTechnician,
        methodFilter,
        originFilter,
        yearFilter,
      }),
    [
      companyLinkedReports,
      company.id,
      searchQuery,
      technicianQuery,
      selectedTechnician,
      methodFilter,
      originFilter,
      yearFilter,
    ]
  );

  const dateGroups = useMemo(
    () => groupReportsByDateCategory(filteredReports, language, groupMode, sortOrder),
    [filteredReports, language, groupMode, sortOrder]
  );

  const toggleExpanded = (reportId: string) => {
    setExpandedReportIds(prev => ({
      ...prev,
      [reportId]: !prev[reportId],
    }));
  };

  const handleQuickDownload = (rep: CompanyInspectionReport) => {
    onExportPdf(company, rep);
    onReportDownloaded?.(rep);
    setDownloadedId(rep.id);
    window.setTimeout(() => {
      setDownloadedId(curr => (curr === rep.id ? null : curr));
    }, 1800);
  };

  const verdictTextColor = (v: ReportVerdict) => {
    if (v === 'ACCEPT') return 'text-emerald-400';
    if (v === 'REJECT') return 'text-rose-400';
    if (v === 'HOLD') return 'text-amber-400';
    return 'text-cyan-400';
  };

  const formatTechEntries = (rep: CompanyInspectionReport) =>
    Object.entries(rep.technicalData || {}).filter(
      ([k, val]) => k !== 'customFields' && val !== undefined && val !== ''
    );

  return (
    <div
      data-testid="company-report-dossier-list"
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-5"
    >
      {/* Dossier Context & Linked Company ID Line */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <h3 className="text-sm font-black text-white">
            {isAr
              ? 'السجل التفصيلي لتقارير الفحص المصنّفة بالتاريخ'
              : 'Detailed Inspection Report Dossier (Categorized by Date)'}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
            <span>{isAr ? 'معرّف الشركة:' : 'Company ID:'} {company.id}</span>
            <span aria-hidden="true">·</span>
            <span>{company.companyCode}</span>
            <span aria-hidden="true">·</span>
            <span>
              {filteredReports.length} / {companyLinkedReports.length}{' '}
              {isAr ? 'تقرير' : 'reports'}
            </span>
          </div>
        </div>

        {/* Date Grouping & Sort Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label={isAr ? 'تجميع التقارير حسب التاريخ' : 'Group reports by date'}
            className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-[11px]"
          >
            {(
              [
                { id: 'month', ar: 'بالشهر', en: 'By Month' },
                { id: 'day', ar: 'باليوم', en: 'By Date' },
                { id: 'year', ar: 'بالسنة', en: 'By Year' },
              ] as const
            ).map(mode => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setGroupMode(mode.id)}
                className={`rounded-md px-2.5 py-1 font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                  groupMode === mode.id
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? mode.ar : mode.en}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowDownUp className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
            <span>
              {sortOrder === 'desc'
                ? isAr
                  ? 'الأحدث أولاً'
                  : 'Newest First'
                : isAr
                  ? 'الأقدم أولاً'
                  : 'Oldest First'}
            </span>
          </button>
        </div>
      </div>

      {/* Search, Technician, Method, Year & Origin Filter Bar */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-2.5 items-center">
          {/* General Report Search */}
          <div className="relative xl:col-span-4">
            <Search
              className={`w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 ${
                isAr ? 'right-3' : 'left-3'
              }`}
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              aria-label={isAr ? 'بحث عام في التقارير' : 'Search inspection reports'}
              placeholder={
                isAr
                  ? 'ابحث برقم الريبورت، رقم الوصلة، المشروع، أو الكود...'
                  : 'Search Report No, Joint ID, Project, or Code...'
              }
              className={`w-full rounded-lg border border-slate-700 bg-slate-950 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none ${
                isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
          </div>

          {/* Dedicated Technician / Inspector Name Text Filter */}
          <div className="relative xl:col-span-3">
            <UserCheck
              className={`w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 ${
                isAr ? 'right-3' : 'left-3'
              }`}
              aria-hidden="true"
            />
            <input
              type="search"
              value={technicianQuery}
              onChange={e => setTechnicianQuery(e.target.value)}
              aria-label={isAr ? 'تصفية حسب اسم الفني أو المفتش' : 'Filter by technician name'}
              placeholder={
                isAr
                  ? 'اسم الفني / المفتش...'
                  : 'Technician / inspector name...'
              }
              className={`w-full rounded-lg border border-slate-700 bg-slate-950 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none ${
                isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
              }`}
            />
          </div>

          {/* Technician Dropdown Selector (populated from company's reports) */}
          <select
            value={selectedTechnician}
            onChange={e => setSelectedTechnician(e.target.value)}
            aria-label={isAr ? 'اختيار الفني من القائمة' : 'Select technician'}
            className="xl:col-span-3 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">
              {isAr ? 'كل الفنيين والمفتشين' : 'All Technicians'}
            </option>
            {availableTechnicians.map(tech => (
              <option key={tech.name} value={tech.name}>
                {tech.name} ({tech.count})
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={yearFilter}
            onChange={e => setYearFilter(e.target.value)}
            aria-label={isAr ? 'تصفية حسب السنة' : 'Filter by year'}
            className="xl:col-span-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-mono tabular-nums text-slate-200 focus:border-cyan-500 focus:outline-none"
          >
            <option value="ALL">{isAr ? 'كل السنوات' : 'All Years'}</option>
            {availableYears.map(yr => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>

        {/* Testing Method Filter Controls (Dropdown + 1-Click Segmented Method Strip) + Origin */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
              aria-label={isAr ? 'تصفية حسب طريقة الفحص' : 'Filter by testing method'}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="ALL">{isAr ? 'كل طرق الفحص' : 'All Testing Methods'}</option>
              {['RT', 'UT', 'PAUT', 'MT', 'PT', 'VT', 'PMI', 'PWHT', 'HYDRO', 'CUSTOM'].map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {availableMethods.length > 0 && (
              <div
                role="group"
                aria-label={isAr ? 'اختيار سريع لطريقة الفحص' : 'Quick testing method filter'}
                className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-[11px]"
              >
                <button
                  type="button"
                  onClick={() => setMethodFilter('ALL')}
                  className={`rounded-md px-2.5 py-1 font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    methodFilter === 'ALL'
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'كل الطرق' : 'All'}
                </button>
                {availableMethods.map(item => (
                  <button
                    key={item.method}
                    type="button"
                    onClick={() =>
                      setMethodFilter(prev => (prev === item.method ? 'ALL' : item.method))
                    }
                    className={`rounded-md px-2.5 py-1 font-mono font-semibold tabular-nums transition cursor-pointer whitespace-nowrap shrink-0 ${
                      methodFilter === item.method
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    {item.method} ({item.count})
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-[11px]">
              {(
                [
                  { id: 'all', ar: 'الكل', en: 'All' },
                  { id: 'new', ar: 'جديد', en: 'New' },
                  { id: 'legacy', ar: 'أرشيف قديم', en: 'Legacy' },
                ] as const
              ).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOriginFilter(tab.id)}
                  className={`rounded-md px-2.5 py-1 font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    originFilter === tab.id
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? tab.ar : tab.en}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-amber-300 transition cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>{isAr ? 'مسح الفلاتر' : 'Reset Filters'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[1, 2, 3].map(idx => (
            <div
              key={idx}
              className="h-14 rounded-lg border border-slate-800 bg-slate-950/60 animate-pulse"
            />
          ))}
        </div>
      ) : dateGroups.length === 0 ? (
        /* Empty State */
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 py-12 px-4 text-center space-y-3">
          <Layers className="w-8 h-8 text-slate-500 mx-auto" aria-hidden="true" />
          <div className="text-sm font-bold text-white">
            {hasActiveFilters
              ? isAr
                ? 'لا توجد تقارير مطابقة للفلاتر المحددة'
                : 'No inspection reports match the selected filters'
              : isAr
                ? 'لا توجد تقارير مطابقة داخل ملف هذه الشركة بعد'
                : 'No inspection reports match in this company dossier yet'}
          </div>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {hasActiveFilters
              ? isAr
                ? 'جرّب تغيير اسم الفني أو طريقة الفحص أو إعادة تعيين الفلاتر لعرض جميع تقارير الشركة.'
                : 'Try adjusting the technician name, testing method, or reset filters to view all reports.'
              : isAr
                ? 'يمكنك البدء فوراً بإدخال بيانات ريبورت جديد أو أرشفة تقرير قديم ليظهر ضمن السجل المصنّف بالتاريخ.'
                : 'Use the New Report Data-Entry Builder to issue a new report or archive a legacy inspection record.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-cyan-300 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAr ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}</span>
              </button>
            )}
            {isAdmin && onOpenBuilder && (
              <button
                type="button"
                onClick={onOpenBuilder}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 transition cursor-pointer"
              >
                <FilePlus2 className="w-4 h-4" aria-hidden="true" />
                <span>{isAr ? 'إدخال أول ريبورت للشركة' : 'Log First Report'}</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Chronological Date Category Sections */
        <div className="space-y-6">
          {dateGroups.map(group => (
            <section
              key={group.groupKey}
              data-testid={`report-date-group-${group.groupKey}`}
              aria-label={group.label}
              className="space-y-2.5"
            >
              {/* Clean Hairline Date Group Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
                  <span>{group.label}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums text-slate-400">
                  <span>
                    {group.reports.length} {isAr ? 'تقرير' : group.reports.length === 1 ? 'report' : 'reports'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-400">
                    {group.acceptedCount} ACCEPT
                  </span>
                  {group.legacyCount > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-400">
                        {group.legacyCount} {isAr ? 'قديم' : 'legacy'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Reports List inside Date Group (single elevation, hairline rows) */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 divide-y divide-slate-800/80">
                {group.reports.map(rep => {
                  const isExpanded = Boolean(expandedReportIds[rep.id]);
                  const isDownloaded = downloadedId === rep.id;
                  const tpl = getReportTemplate(rep.templateKey || rep.method);
                  const techEntries = formatTechEntries(rep);
                  const customRows = Array.isArray(rep.technicalData?.customFields)
                    ? rep.technicalData.customFields
                    : [];

                  return (
                    <div
                      key={rep.id}
                      data-testid={`dossier-report-row-${rep.id}`}
                      className="p-4 space-y-3 hover:bg-slate-900/40 transition"
                    >
                      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                        {/* Primary Report Details */}
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                            <span className="font-mono font-bold text-cyan-300 tabular-nums">
                              {rep.reportNumber}
                            </span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="font-mono font-bold text-white">
                              {rep.method}
                            </span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className={`font-mono font-bold ${verdictTextColor(rep.verdict)}`}>
                              {rep.verdict}
                            </span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="font-mono tabular-nums text-slate-300">
                              {rep.inspectionDate}
                            </span>
                            <span aria-hidden="true" className="text-slate-600">·</span>
                            <span className="text-slate-400">
                              {rep.isLegacyArchive
                                ? isAr
                                  ? 'أرشيف قديم'
                                  : 'Legacy Archive'
                                : isAr
                                  ? 'إدخال حديث'
                                  : 'Portal Entry'}
                            </span>
                          </div>

                          <div className="text-xs font-semibold text-white">
                            {rep.componentOrJointId}
                            <span className="text-slate-400 font-normal">
                              {' — '}
                              {isAr ? tpl.titleAr : tpl.titleEn}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-400">
                            <span>{rep.projectName}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-slate-300">{rep.codeStandard}</span>
                            {rep.materialSpec && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>
                                  {rep.materialSpec}
                                  {rep.thicknessMm ? ` (${rep.thicknessMm} mm)` : ''}
                                </span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span>
                              {isAr ? 'المفتش: ' : 'Inspector: '}
                              {rep.inspectorName}
                            </span>
                          </div>
                        </div>

                        {/* Quick Download & Inspection Actions */}
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuickDownload(rep)}
                            aria-label={
                              isAr
                                ? `تحميل سريع PDF للتقرير ${rep.reportNumber}`
                                : `Quick Download PDF for ${rep.reportNumber}`
                            }
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                              isDownloaded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            }`}
                          >
                            {isDownloaded ? (
                              <>
                                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>{isAr ? 'تم التحميل' : 'Downloaded'}</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>{isAr ? 'تحميل سريع' : 'Quick Download'}</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            aria-expanded={isExpanded}
                            onClick={() => toggleExpanded(rep.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition cursor-pointer whitespace-nowrap shrink-0"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                            <span>{isAr ? 'البيانات الفنية' : 'Details'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onPreviewReport(rep)}
                            title={isAr ? 'معاينة التقرير الكاملة' : 'Full Report Preview'}
                            aria-label={
                              isAr
                                ? `معاينة التقرير ${rep.reportNumber}`
                                : `Preview report ${rep.reportNumber}`
                            }
                            className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>

                          {isAdmin && rep.status !== 'archived' && onArchiveReport && (
                            <button
                              type="button"
                              onClick={() => onArchiveReport(rep)}
                              title={isAr ? 'أرشفة التقرير' : 'Archive Report'}
                              aria-label={
                                isAr
                                  ? `أرشفة التقرير ${rep.reportNumber}`
                                  : `Archive report ${rep.reportNumber}`
                              }
                              className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-300 hover:text-emerald-300 transition cursor-pointer"
                            >
                              <Archive className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          )}

                          {isAdmin && onDeleteReport && (
                            <button
                              type="button"
                              onClick={() => onDeleteReport(rep)}
                              title={isAr ? 'حذف التقرير' : 'Delete Report'}
                              aria-label={
                                isAr
                                  ? `حذف التقرير ${rep.reportNumber}`
                                  : `Delete report ${rep.reportNumber}`
                              }
                              className="rounded-lg border border-slate-700 bg-slate-900 p-1.5 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expandable Inline Dossier Parameters & Remarks */}
                      {isExpanded && (
                        <div className="border-t border-slate-800 pt-3 space-y-3 text-xs">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px]">
                            <div>
                              <span className="text-slate-400">{isAr ? 'رقم أمر الشراء PO: ' : 'Client PO: '}</span>
                              <span className="font-mono text-slate-200">{rep.clientPoNumber || '-'}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">{isAr ? 'حالة التقرير: ' : 'Status: '}</span>
                              <span className="font-mono uppercase text-slate-200">{rep.status}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">{isAr ? 'القالب: ' : 'Template: '}</span>
                              <span className="font-mono text-slate-200">{rep.templateKey}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">{isAr ? 'معرّف التقرير: ' : 'Report ID: '}</span>
                              <span className="font-mono text-slate-300 tabular-nums">{rep.id}</span>
                            </div>
                          </div>

                          {(techEntries.length > 0 || customRows.length > 0) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 border-t border-slate-800/70 pt-2.5 text-[11px]">
                              {techEntries.map(([key, val]) => (
                                <div key={key} className="flex items-center justify-between gap-2">
                                  <span className="text-slate-400 font-mono">{key}</span>
                                  <span className="text-slate-100 font-semibold font-mono tabular-nums">
                                    {String(val)}
                                  </span>
                                </div>
                              ))}
                              {customRows.map((row, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-2">
                                  <span className="text-slate-400">{row.label}</span>
                                  <span className="text-slate-100 font-semibold font-mono tabular-nums">
                                    {row.value} {row.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {rep.notes && (
                            <div className="text-[11px] text-slate-300 border-t border-slate-800/70 pt-2">
                              <span className="font-semibold text-slate-400">
                                {isAr ? 'ملاحظات المفتش: ' : 'Inspector Notes: '}
                              </span>
                              {rep.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};
