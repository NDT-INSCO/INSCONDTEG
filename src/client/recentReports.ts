import type { CompanyInspectionReport, NdtReportMethod } from './types';

export const MAX_RECENT_DOWNLOADED_REPORTS = 5;
const RECENT_REPORTS_STORAGE_PREFIX = 'insco_recent_downloaded_reports_v1_';

export interface RecentDownloadedReportEntry {
  reportId: string;
  companyId: string;
  reportNumber: string;
  method: NdtReportMethod;
  componentOrJointId: string;
  inspectionDate: string;
  inspectorName: string;
  downloadedAt: string;
  reportSnapshot?: CompanyInspectionReport;
}

function getStorageKey(companyId: string): string {
  return `${RECENT_REPORTS_STORAGE_PREFIX}${companyId.trim()}`;
}

function isValidEntry(value: unknown, companyId: string): value is RecentDownloadedReportEntry {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<RecentDownloadedReportEntry>;
  return (
    typeof candidate.reportId === 'string' &&
    candidate.reportId.length > 0 &&
    typeof candidate.companyId === 'string' &&
    candidate.companyId === companyId &&
    typeof candidate.reportNumber === 'string' &&
    candidate.reportNumber.length > 0 &&
    typeof candidate.method === 'string' &&
    typeof candidate.downloadedAt === 'string'
  );
}

/**
 * Loads up to the last 5 downloaded inspection reports for a specific company dossier.
 */
export function loadRecentDownloadedReports(
  companyId: string
): RecentDownloadedReportEntry[] {
  if (!companyId || typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey(companyId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is RecentDownloadedReportEntry => isValidEntry(item, companyId))
      .slice(0, MAX_RECENT_DOWNLOADED_REPORTS);
  } catch {
    return [];
  }
}

/**
 * Prepends a downloaded report to the company's recent downloads list (deduplicated, max 5)
 * and persists it to localStorage.
 */
export function recordRecentDownloadedReport(
  companyId: string,
  report: CompanyInspectionReport,
  downloadedAtIso: string = new Date().toISOString()
): RecentDownloadedReportEntry[] {
  if (!companyId || (report.companyId && report.companyId !== companyId)) {
    return loadRecentDownloadedReports(companyId);
  }

  const nextEntry: RecentDownloadedReportEntry = {
    reportId: report.id,
    companyId,
    reportNumber: report.reportNumber,
    method: report.method,
    componentOrJointId: report.componentOrJointId,
    inspectionDate: report.inspectionDate,
    inspectorName: report.inspectorName,
    downloadedAt: downloadedAtIso,
    reportSnapshot: { ...report, companyId },
  };

  const existing = loadRecentDownloadedReports(companyId).filter(
    item => item.reportId !== report.id
  );
  const updated = [nextEntry, ...existing].slice(0, MAX_RECENT_DOWNLOADED_REPORTS);

  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(getStorageKey(companyId), JSON.stringify(updated));
    }
  } catch {
    // ignore storage quota errors
  }

  return updated;
}

/**
 * Clears all recent download entries for the specified company dossier.
 */
export function clearRecentDownloadedReports(
  companyId: string
): RecentDownloadedReportEntry[] {
  if (!companyId) return [];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(getStorageKey(companyId));
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * Resolves the freshest CompanyInspectionReport record from live company reports,
 * falling back to the stored snapshot if the report is outside the active filter.
 */
export function resolveRecentReportForDownload(
  entry: RecentDownloadedReportEntry,
  companyReports: readonly CompanyInspectionReport[]
): CompanyInspectionReport | null {
  const liveMatch = companyReports.find(
    r => r.id === entry.reportId && (!r.companyId || r.companyId === entry.companyId)
  );
  if (liveMatch) return liveMatch;
  if (
    entry.reportSnapshot &&
    (!entry.reportSnapshot.companyId || entry.reportSnapshot.companyId === entry.companyId)
  ) {
    return entry.reportSnapshot;
  }
  return null;
}
