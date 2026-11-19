import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  LogIn,
  LogOut,
  MapPin,
  ShieldAlert,
} from 'lucide-react';
import type { Language } from '../../types';
import type { AttendanceLog } from '../../client/types';
import { formatCoordinates, formatDistanceMeters } from '../../client/geofencing';

interface EmployeeAttendanceTimelineProps {
  language: Language;
  logs: AttendanceLog[];
  companyName?: string;
  companyCode?: string;
  title?: string;
  emptyMessage?: string;
}

type TimelineFilter = 'all' | 'alerts' | 'check_in' | 'check_out';

function formatLogTimestamp(iso: string, language: Language): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(d);
  } catch {
    return iso.replace('T', ' ').slice(0, 16);
  }
}

export const EmployeeAttendanceTimeline: React.FC<EmployeeAttendanceTimelineProps> = ({
  language,
  logs,
  companyName,
  companyCode,
  title,
  emptyMessage,
}) => {
  const isAr = language === 'ar';
  const [filter, setFilter] = useState<TimelineFilter>('all');

  const outsideAlerts = useMemo(
    () => logs.filter(l => l.geofenceStatus === 'outside_geofence'),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const sorted = [...logs].sort((a, b) =>
      (b.timestampIso || '').localeCompare(a.timestampIso || '')
    );
    if (filter === 'alerts') return sorted.filter(l => l.geofenceStatus === 'outside_geofence');
    if (filter === 'check_in') return sorted.filter(l => l.eventType === 'check_in');
    if (filter === 'check_out') return sorted.filter(l => l.eventType === 'check_out');
    return sorted;
  }, [logs, filter]);

  return (
    <div
      data-testid="employee-attendance-timeline"
      className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-4"
    >
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-emerald-400">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {companyCode
                ? `${companyCode} · ${isAr ? 'الجدول الزمني للحضور' : 'Attendance Timeline'}`
                : isAr
                  ? 'الجدول الزمني للعمال الميدانيين'
                  : 'Field Workforce Attendance Timeline'}
            </span>
          </div>
          <h3 className="text-base font-black text-white">
            {title ||
              (isAr
                ? 'سجل دخول وخروج الموظفين الميدانيين بالإحداثيات الجغرافية'
                : 'Field Crew Check-In / Check-Out Coordinate Timeline')}
          </h3>
          {companyName && <p className="text-xs text-slate-400">{companyName}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
          {(
            [
              { id: 'all', ar: `الكل (${logs.length})`, en: `All (${logs.length})` },
              {
                id: 'alerts',
                ar: `تنبيهات النطاق (${outsideAlerts.length})`,
                en: `Geofence Alerts (${outsideAlerts.length})`,
              },
              { id: 'check_in', ar: 'دخول', en: 'Check-In' },
              { id: 'check_out', ar: 'انصراف', en: 'Check-Out' },
            ] as const
          ).map(btn => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setFilter(btn.id)}
              className={`rounded-md px-2.5 py-1.5 font-semibold transition cursor-pointer whitespace-nowrap ${
                filter === btn.id
                  ? btn.id === 'alerts' && outsideAlerts.length > 0
                    ? 'bg-rose-600 text-white'
                    : 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? btn.ar : btn.en}
            </button>
          ))}
        </div>
      </div>

      {/* Admin Geofencing Alert Banner */}
      {outsideAlerts.length > 0 && (
        <div
          role="alert"
          data-testid="geofencing-admin-alert"
          className="rounded-xl border border-rose-500/50 bg-rose-950/35 p-4 space-y-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-black text-rose-300">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" aria-hidden="true" />
              <span>
                {isAr
                  ? `تنبيه إداري (Geofencing Alert): تم رصد ${outsideAlerts.length} عملية تسجيل خارج نطاق المشروع المحدد`
                  : `Admin Geofencing Alert: ${outsideAlerts.length} check-in/out event(s) recorded outside the designated project perimeter`}
              </span>
            </div>
            <span className="font-mono text-[11px] font-bold text-rose-200 tabular-nums">
              {isAr ? 'مراجعة فورية مطلوبة' : 'Supervisor Review Required'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {outsideAlerts.slice(0, 4).map(alertLog => (
              <div
                key={`alert-${alertLog.id}`}
                className="rounded-lg border border-rose-500/30 bg-slate-950/70 px-3 py-2 text-[11px] flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">{alertLog.employeeName}</div>
                  <div className="font-mono text-rose-300 tabular-nums">
                    {formatCoordinates(alertLog.lat, alertLog.lng)}
                  </div>
                </div>
                <div className="text-end shrink-0 font-mono tabular-nums">
                  <div className="font-bold text-rose-300">
                    +{formatDistanceMeters(
                      Math.max(0, alertLog.distanceFromSiteMeters - alertLog.geofenceRadiusMeters),
                      language
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {isAr ? 'تجاوز عن النطاق' : 'beyond radius'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chronological Timeline List */}
      {filteredLogs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-8 text-center text-xs text-slate-400">
          {emptyMessage ||
            (isAr
              ? 'لا توجد سجلات حضور أو انصراف مطابقة للفلتر الحالي.'
              : 'No attendance check-in/out records match the active filter.')}
        </div>
      ) : (
        <ol className="relative border-s border-slate-800 ms-3 space-y-4">
          {filteredLogs.map(log => {
            const isOutside = log.geofenceStatus === 'outside_geofence';
            const isCheckIn = log.eventType === 'check_in';
            return (
              <li key={log.id} className="ms-5 relative">
                <span
                  aria-hidden="true"
                  className={`absolute -start-[29px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-950 ${
                    isOutside
                      ? 'bg-rose-500'
                      : isCheckIn
                        ? 'bg-emerald-500'
                        : 'bg-cyan-500'
                  }`}
                />

                <div
                  className={`rounded-xl border p-3.5 space-y-2 transition ${
                    isOutside
                      ? 'border-rose-500/45 bg-rose-950/15'
                      : 'border-slate-800 bg-slate-950/75'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-bold ${
                          isCheckIn
                            ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300'
                            : 'border-cyan-500/35 bg-cyan-500/10 text-cyan-300'
                        }`}
                      >
                        {isCheckIn ? (
                          <LogIn className="w-3 h-3" aria-hidden="true" />
                        ) : (
                          <LogOut className="w-3 h-3" aria-hidden="true" />
                        )}
                        <span>
                          {isCheckIn
                            ? isAr
                              ? 'تسجيل دخول'
                              : 'Check-In'
                            : isAr
                              ? 'تسجيل انصراف'
                              : 'Check-Out'}
                        </span>
                      </span>

                      <span className="text-xs font-black text-white">{log.employeeName}</span>
                      <span className="text-[11px] font-mono text-slate-400">{log.companyCode}</span>
                    </div>

                    <time
                      dateTime={log.timestampIso}
                      className="text-[11px] font-mono text-slate-400 tabular-nums"
                    >
                      {formatLogTimestamp(log.timestampIso, language)}
                    </time>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono tabular-nums">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
                      <span>{formatCoordinates(log.lat, log.lng)}</span>
                    </div>

                    <div
                      className={`flex items-center gap-1.5 font-bold ${
                        isOutside ? 'text-rose-300' : 'text-emerald-300'
                      }`}
                    >
                      {isOutside ? (
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      )}
                      <span>
                        {isOutside
                          ? isAr
                            ? `خارج النطاق (${formatDistanceMeters(log.distanceFromSiteMeters, language)} / ${log.geofenceRadiusMeters} م)`
                            : `OUTSIDE GEOFENCE (${formatDistanceMeters(log.distanceFromSiteMeters, language)} / ${log.geofenceRadiusMeters}m)`
                          : isAr
                            ? `داخل النطاق (${formatDistanceMeters(log.distanceFromSiteMeters, language)} / ${log.geofenceRadiusMeters} م)`
                            : `Inside Perimeter (${formatDistanceMeters(log.distanceFromSiteMeters, language)} / ${log.geofenceRadiusMeters}m)`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Camera
                        className={`w-3.5 h-3.5 shrink-0 ${
                          log.faceVerified ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                        aria-hidden="true"
                      />
                      <span>
                        {log.faceVerified
                          ? isAr
                            ? 'تم التحقق بالوجه + GPS'
                            : 'Face + GPS Verified'
                          : isAr
                            ? 'تحقق GPS فقط'
                            : 'GPS Only'}
                      </span>
                    </div>
                  </div>

                  {(log.notes || log.deviceLabel) && (
                    <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-1.5 flex flex-wrap items-center justify-between gap-2">
                      <span>{log.notes || ''}</span>
                      {log.deviceLabel && (
                        <span className="font-mono text-[10px] text-slate-500">{log.deviceLabel}</span>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
};
