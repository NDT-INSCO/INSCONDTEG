import React, { useEffect, useRef, useState } from 'react';
import { Check, Clock, Download, Eye, Trash2 } from 'lucide-react';
import type { Language } from '../../types';
import type { CompanyInspectionReport } from '../../client/types';
import {
  MAX_RECENT_DOWNLOADED_REPORTS,
  resolveRecentReportForDownload,
  type RecentDownloadedReportEntry,
} from '../../client/recentReports';

interface RecentReportsPanelProps {
  language: Language;
  entries: RecentDownloadedReportEntry[];
  companyReports: readonly CompanyInspectionReport[];
  onRedownload: (report: CompanyInspectionReport) => void;
  onPreviewReport?: (report: CompanyInspectionReport) => void;
  onClearRecent: () => void;
}

function formatDownloadTimestamp(iso: string, language: Language): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  try {
    return parsed.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso.slice(11, 16);
  }
}

export const RecentReportsPanel: React.FC<RecentReportsPanelProps> = ({
  language,
  entries,
  companyReports,
  onRedownload,
  onPreviewReport,
  onClearRecent,
}) => {
  const isAr = language === 'ar';
  const [redownloadedId, setRedownloadedId] = useState<string | null>(null);
  const confirmTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current !== null) {
        window.clearTimeout(confirmTimerRef.current);
      }
    };
  }, []);

  const handleRedownloadClick = (entry: RecentDownloadedReportEntry) => {
    const resolved = resolveRecentReportForDownload(entry, companyReports);
    if (!resolved) return;
    onRedownload(resolved);
    setRedownloadedId(entry.reportId);
    if (confirmTimerRef.current !== null) {
      window.clearTimeout(confirmTimerRef.current);
    }
    confirmTimerRef.current = window.setTimeout(() => {
      setRedownloadedId(curr => (curr === entry.reportId ? null : curr));
    }, 1800);
  };

  return (
    <aside
      data-testid="recent-reports-panel"
      aria-label={isAr ? 'أحدث التقارير المحمّلة' : 'Recent Reports'}
      className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3"
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
            <h3 className="text-sm font-black text-white truncate">
              {isAr ? 'أحدث التقارير' : 'Recent Reports'}
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-mono tabular-nums">
            {isAr
              ? `آخر ${entries.length} / ${MAX_RECENT_DOWNLOADED_REPORTS} تحميلات`
              : `Last ${entries.length} / ${MAX_RECENT_DOWNLOADED_REPORTS} downloads`}
          </p>
        </div>

        {entries.length > 0 && (
          <button
            type="button"
            onClick={onClearRecent}
            aria-label={isAr ? 'مسح قائمة أحدث التقارير' : 'Clear recent reports'}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-rose-300 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <Trash2 className="w-3 h-3" aria-hidden="true" />
            <span>{isAr ? 'مسح' : 'Clear'}</span>
          </button>
        )}
      </div>

      {/* Empty State vs. Populated List */}
      {entries.length === 0 ? (
        <div
          data-testid="recent-reports-empty"
          className="rounded-lg border border-dashed border-slate-800 bg-slate-950/50 py-8 px-3 text-center space-y-2"
        >
          <Download className="w-6 h-6 text-slate-500 mx-auto" aria-hidden="true" />
          <div className="text-xs font-bold text-slate-200">
            {isAr ? 'لا توجد تحميلات حديثة بعد' : 'No recent downloads yet'}
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isAr
              ? 'عند تحميل أي تقرير من الأرشيف سيظهر هنا لإعادة التحميل الفوري.'
              : 'Download any report from the archive to access your last 5 downloads here.'}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-800/80">
          {entries.map((entry, idx) => {
            const resolved = resolveRecentReportForDownload(entry, companyReports);
            const isJustRedownloaded = redownloadedId === entry.reportId;

            return (
              <li
                key={entry.reportId}
                data-testid={`recent-report-item-${idx}`}
                className="py-3 first:pt-1 last:pb-1 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <div className="text-xs font-mono font-bold text-cyan-300 tabular-nums truncate">
                      {entry.reportNumber}
                    </div>
                    <div className="text-[11px] font-semibold text-white truncate">
                      {entry.componentOrJointId}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] text-slate-400 font-mono tabular-nums">
                      <span>{entry.method}</span>
                      <span aria-hidden="true">·</span>
                      <span>{entry.inspectionDate}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatDownloadTimestamp(entry.downloadedAt, language)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!resolved}
                    onClick={() => handleRedownloadClick(entry)}
                    aria-label={
                      isAr
                        ? `إعادة تحميل التقرير ${entry.reportNumber}`
                        : `Re-download ${entry.reportNumber}`
                    }
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 ${
                      isJustRedownloaded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    }`}
                  >
                    {isJustRedownloaded ? (
                      <>
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isAr ? 'تم إعادة التحميل' : 'Downloaded'}</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isAr ? 'إعادة تحميل' : 'Re-download'}</span>
                      </>
                    )}
                  </button>

                  {onPreviewReport && resolved && (
                    <button
                      type="button"
                      onClick={() => onPreviewReport(resolved)}
                      title={isAr ? 'معاينة التقرير' : 'Preview Report'}
                      aria-label={
                        isAr
                          ? `معاينة التقرير ${entry.reportNumber}`
                          : `Preview recent report ${entry.reportNumber}`
                      }
                      className="rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 p-1.5 text-slate-300 hover:text-cyan-300 transition cursor-pointer shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
};
