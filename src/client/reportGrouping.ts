import type { Language } from '../types';
import type { CompanyInspectionReport, NdtReportMethod } from './types';

export type DateGroupingMode = 'month' | 'day' | 'year';
export type DateSortOrder = 'desc' | 'asc';

export interface DateCategorizedReportGroup {
  groupKey: string;
  label: string;
  reports: CompanyInspectionReport[];
  acceptedCount: number;
  legacyCount: number;
}

export interface TechnicianSummary {
  name: string;
  count: number;
}

export interface MethodSummary {
  method: NdtReportMethod;
  count: number;
}

export interface DossierReportFilterCriteria {
  searchQuery?: string;
  technicianQuery?: string;
  selectedTechnician?: string;
  methodFilter?: string;
  originFilter?: 'all' | 'new' | 'legacy';
  yearFilter?: string;
}

const MONTH_NAMES_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

const MONTH_NAMES_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Ensures reports rendered inside a company dossier strictly belong to that company ID.
 */
export function filterReportsForCompany(
  reports: readonly CompanyInspectionReport[],
  companyId: string
): CompanyInspectionReport[] {
  return reports.filter(r => !r.companyId || r.companyId === companyId);
}

export function extractIsoYear(inspectionDate?: string): string | null {
  if (!inspectionDate) return null;
  const match = inspectionDate.trim().match(/^(\d{4})/);
  return match ? match[1] : null;
}

export function extractReportYears(
  reports: readonly CompanyInspectionReport[]
): string[] {
  const years = new Set<string>();
  for (const rep of reports) {
    const yr = extractIsoYear(rep.inspectionDate);
    if (yr) years.add(yr);
  }
  return Array.from(years).sort((a, b) => b.localeCompare(a));
}

/**
 * Extracts distinct technician / inspector names present in the company's reports with counts.
 */
export function extractReportTechnicians(
  reports: readonly CompanyInspectionReport[]
): TechnicianSummary[] {
  const map = new Map<string, TechnicianSummary>();
  for (const rep of reports) {
    const raw = (rep.inspectorName || '').trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(key, { name: raw, count: 1 });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Extracts distinct testing methods present in the company's reports with counts.
 */
export function extractReportMethodsWithCounts(
  reports: readonly CompanyInspectionReport[]
): MethodSummary[] {
  const map = new Map<NdtReportMethod, number>();
  for (const rep of reports) {
    map.set(rep.method, (map.get(rep.method) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([method, count]) => ({ method, count }))
    .sort((a, b) => a.method.localeCompare(b.method));
}

/**
 * Filters reports strictly linked to the company ID by technician name,
 * testing method, origin, year, and free-text query.
 */
export function filterCompanyDossierReports(
  reports: readonly CompanyInspectionReport[],
  companyId: string,
  filters: DossierReportFilterCriteria
): CompanyInspectionReport[] {
  const q = (filters.searchQuery || '').trim().toLowerCase();
  const techQ = (filters.technicianQuery || '').trim().toLowerCase();
  const selectedTech =
    filters.selectedTechnician && filters.selectedTechnician !== 'ALL'
      ? filters.selectedTechnician.trim().toLowerCase()
      : '';
  const methodFilter = filters.methodFilter || 'ALL';
  const originFilter = filters.originFilter || 'all';
  const yearFilter = filters.yearFilter || 'ALL';

  return filterReportsForCompany(reports, companyId).filter(r => {
    if (methodFilter !== 'ALL' && r.method !== methodFilter) return false;
    if (originFilter === 'legacy' && !r.isLegacyArchive) return false;
    if (originFilter === 'new' && r.isLegacyArchive) return false;
    if (yearFilter !== 'ALL' && extractIsoYear(r.inspectionDate) !== yearFilter) return false;

    const inspector = (r.inspectorName || '').trim().toLowerCase();
    if (selectedTech && inspector !== selectedTech) return false;
    if (techQ && !inspector.includes(techQ)) return false;

    if (!q) return true;
    return (
      r.reportNumber.toLowerCase().includes(q) ||
      r.projectName.toLowerCase().includes(q) ||
      r.componentOrJointId.toLowerCase().includes(q) ||
      inspector.includes(q) ||
      r.codeStandard.toLowerCase().includes(q) ||
      r.method.toLowerCase().includes(q) ||
      (r.clientPoNumber ?? '').toLowerCase().includes(q)
    );
  });
}

function getDateGroupMeta(
  inspectionDate: string | undefined,
  mode: DateGroupingMode,
  language: Language
): { groupKey: string; label: string } {
  const clean = (inspectionDate || '').trim();
  const match = clean.match(/^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?/);
  if (!match) {
    return {
      groupKey: '0000-undated',
      label: language === 'ar' ? 'تقارير بدون تاريخ محدد' : 'Undated Reports',
    };
  }

  const year = match[1];
  const monthNum = match[2] ? Number.parseInt(match[2], 10) : 0;
  const day = match[3] || '';

  if (mode === 'year' || monthNum < 1 || monthNum > 12) {
    return {
      groupKey: year,
      label: language === 'ar' ? `سجل عام ${year}` : `Year ${year}`,
    };
  }

  if (mode === 'day' && day) {
    const monthName =
      language === 'ar' ? MONTH_NAMES_AR[monthNum - 1] : MONTH_NAMES_EN[monthNum - 1];
    return {
      groupKey: `${year}-${match[2]}-${day}`,
      label: `${day} ${monthName} ${year}`,
    };
  }

  const monthName =
    language === 'ar' ? MONTH_NAMES_AR[monthNum - 1] : MONTH_NAMES_EN[monthNum - 1];
  return {
    groupKey: `${year}-${match[2]}`,
    label: `${monthName} ${year}`,
  };
}

/**
 * Groups inspection reports into chronological date categories (by month, exact date, or year)
 * sorted newest-first or oldest-first.
 */
export function groupReportsByDateCategory(
  reports: readonly CompanyInspectionReport[],
  language: Language,
  mode: DateGroupingMode = 'month',
  sortOrder: DateSortOrder = 'desc'
): DateCategorizedReportGroup[] {
  const sorted = [...reports].sort((a, b) => {
    const dateA = (a.inspectionDate || '').trim();
    const dateB = (b.inspectionDate || '').trim();
    const cmp =
      sortOrder === 'desc' ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    if (cmp !== 0) return cmp;
    return a.reportNumber.localeCompare(b.reportNumber);
  });

  const bucketMap = new Map<string, DateCategorizedReportGroup>();

  for (const rep of sorted) {
    const meta = getDateGroupMeta(rep.inspectionDate, mode, language);
    let bucket = bucketMap.get(meta.groupKey);
    if (!bucket) {
      bucket = {
        groupKey: meta.groupKey,
        label: meta.label,
        reports: [],
        acceptedCount: 0,
        legacyCount: 0,
      };
      bucketMap.set(meta.groupKey, bucket);
    }
    bucket.reports.push(rep);
    if (rep.verdict === 'ACCEPT') bucket.acceptedCount += 1;
    if (rep.isLegacyArchive) bucket.legacyCount += 1;
  }

  return Array.from(bucketMap.values());
}
