import React, { useEffect, useMemo, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  MapPin,
  Navigation,
  Radar,
  RefreshCw,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { Language } from '../../types';
import type { AttendanceLog, CompanyEmployee, CompanyRecord } from '../../client/types';
import {
  evaluateGeofence,
  formatCoordinates,
  formatDistanceMeters,
  resolveSiteCoordinates,
} from '../../client/geofencing';

interface EmployeeMapTrackerProps {
  language: Language;
  company: CompanyRecord;
  employees: CompanyEmployee[];
  attendanceLogs?: AttendanceLog[];
  selectedEmployeeId?: string | null;
  onSelectEmployee?: (employeeId: string) => void;
  onRequestLocationUpdate?: (employee: CompanyEmployee) => void;
  isUpdatingLocation?: boolean;
}

function readMapsApiKey(): string {
  try {
    const meta = import.meta as { env?: Record<string, string | undefined> };
    return (meta.env?.VITE_GOOGLE_MAPS_API_KEY ?? '').trim();
  } catch {
    return '';
  }
}

interface GeofenceCircleOverlayProps {
  centerLat: number;
  centerLng: number;
  radiusMeters: number;
  hasAlerts: boolean;
}

interface MapsCircleHandle {
  setMap: (map: unknown) => void;
}

interface GlobalMapsNamespace {
  maps?: {
    Circle?: new (opts: {
      map: unknown;
      center: { lat: number; lng: number };
      radius: number;
      strokeColor: string;
      strokeOpacity: number;
      strokeWeight: number;
      fillColor: string;
      fillOpacity: number;
    }) => MapsCircleHandle;
  };
}

const GeofenceCircleOverlay: React.FC<GeofenceCircleOverlayProps> = ({
  centerLat,
  centerLng,
  radiusMeters,
  hasAlerts,
}) => {
  const map = useMap();

  useEffect(() => {
    const g = (globalThis as { google?: GlobalMapsNamespace }).google;
    if (!map || !g?.maps?.Circle) return;

    const circle = new g.maps.Circle({
      map,
      center: { lat: centerLat, lng: centerLng },
      radius: radiusMeters,
      strokeColor: hasAlerts ? '#f59e0b' : '#06b6d4',
      strokeOpacity: 0.85,
      strokeWeight: 2,
      fillColor: hasAlerts ? '#f59e0b' : '#06b6d4',
      fillOpacity: 0.12,
    });

    return () => {
      circle.setMap(null);
    };
  }, [map, centerLat, centerLng, radiusMeters, hasAlerts]);

  return null;
};

export const EmployeeMapTracker: React.FC<EmployeeMapTrackerProps> = ({
  language,
  company,
  employees,
  attendanceLogs = [],
  selectedEmployeeId,
  onSelectEmployee,
  onRequestLocationUpdate,
  isUpdatingLocation = false,
}) => {
  const isAr = language === 'ar';
  const apiKey = useMemo(() => readMapsApiKey(), []);
  const site = useMemo(() => resolveSiteCoordinates(company), [company]);

  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const activeEmpId = selectedEmployeeId !== undefined ? selectedEmployeeId : internalSelectedId;

  const setActiveEmpId = (id: string | null) => {
    setInternalSelectedId(id);
    if (id && onSelectEmployee) onSelectEmployee(id);
  };

  const trackedEmployees = useMemo(() => {
    return employees.map(emp => {
      const hasCoords =
        typeof emp.lastLat === 'number' &&
        Number.isFinite(emp.lastLat) &&
        typeof emp.lastLng === 'number' &&
        Number.isFinite(emp.lastLng);

      const latestLog = attendanceLogs.find(log => log.employeeId === emp.id);
      const lat = hasCoords ? emp.lastLat! : latestLog?.lat;
      const lng = hasCoords ? emp.lastLng! : latestLog?.lng;

      const geo =
        typeof lat === 'number' && typeof lng === 'number'
          ? evaluateGeofence({
              workerLat: lat,
              workerLng: lng,
              siteLat: site.lat,
              siteLng: site.lng,
              radiusMeters: site.geofenceRadiusMeters,
            })
          : null;

      return {
        employee: emp,
        lat,
        lng,
        hasCoords: typeof lat === 'number' && typeof lng === 'number',
        geo,
        isOutside: geo?.status === 'outside_geofence' || emp.onlineStatus === 'alert',
      };
    });
  }, [employees, attendanceLogs, site]);

  const outsideAlertCount = useMemo(
    () => trackedEmployees.filter(item => item.isOutside).length,
    [trackedEmployees]
  );

  const selectedEntry = useMemo(
    () => trackedEmployees.find(item => item.employee.id === activeEmpId) ?? null,
    [trackedEmployees, activeEmpId]
  );

  const statusLabel = (status: CompanyEmployee['onlineStatus'], isOutside: boolean) => {
    if (isOutside || status === 'alert') {
      return isAr ? 'تنبيه: خارج النطاق' : 'Alert: Outside Geofence';
    }
    if (status === 'on_site') return isAr ? 'داخل الموقع' : 'On Site';
    if (status === 'in_transit') return isAr ? 'في الطريق' : 'In Transit';
    return isAr ? 'خارج المناوبة' : 'Off Duty';
  };

  return (
    <section
      data-testid="employee-map-tracker"
      className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-4"
    >
      {/* Header & Summary Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-cyan-400">
            <Radar className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {isAr
                ? `تتبع المواقع المباشر · ${company.companyCode}`
                : `Live GPS Employee Tracker · ${company.companyCode}`}
            </span>
          </div>
          <h3 className="text-base font-black text-white">
            {isAr
              ? 'خريطة انتشار الفنيين ونطاق المشروع الجغرافي'
              : 'Field Technician Map & Project Geofence Perimeter'}
          </h3>
          <p className="text-xs text-slate-400">
            {isAr
              ? `مركز الموقع: ${formatCoordinates(site.lat, site.lng)} · نصف قطر النطاق: ${formatDistanceMeters(site.geofenceRadiusMeters, language)}`
              : `Site Center: ${formatCoordinates(site.lat, site.lng)} · Geofence Radius: ${formatDistanceMeters(site.geofenceRadiusMeters, language)}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs font-mono tabular-nums">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-slate-200">
            <Users className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
            <span>
              {trackedEmployees.filter(t => t.hasCoords).length}/{employees.length}{' '}
              {isAr ? 'متصل بالإحداثيات' : 'GPS Tracked'}
            </span>
          </span>
          {outsideAlertCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 font-bold text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {outsideAlertCount} {isAr ? 'خارج النطاق' : 'Outside Perimeter'}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'جميع الفنيين داخل النطاق' : 'All Tracked Crew Inside'}</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Split View: Interactive Map + Technician Coordinates List */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        <div className="xl:col-span-7 min-w-0">
          {apiKey ? (
            <div className="h-[380px] w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <APIProvider apiKey={apiKey} language={language} region="EG">
                <GoogleMap
                  mapId="DEMO_MAP_ID"
                  defaultCenter={{ lat: site.lat, lng: site.lng }}
                  defaultZoom={14}
                  gestureHandling="cooperative"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                >
                  <GeofenceCircleOverlay
                    centerLat={site.lat}
                    centerLng={site.lng}
                    radiusMeters={site.geofenceRadiusMeters}
                    hasAlerts={outsideAlertCount > 0}
                  />

                  {/* Project Site Center Pin */}
                  <AdvancedMarker
                    position={{ lat: site.lat, lng: site.lng }}
                    title={isAr ? company.nameAr : company.nameEn}
                  >
                    <Pin background="#0891b2" borderColor="#ecfeff" glyphColor="#ffffff" />
                  </AdvancedMarker>

                  {/* Live Technician Markers */}
                  {trackedEmployees
                    .filter(item => item.hasCoords)
                    .map(item => (
                      <AdvancedMarker
                        key={item.employee.id}
                        position={{ lat: item.lat!, lng: item.lng! }}
                        title={`${item.employee.fullName} (${item.employee.badgeCode})`}
                        onClick={() => setActiveEmpId(item.employee.id)}
                      >
                        <Pin
                          background={item.isOutside ? '#e11d48' : '#10b981'}
                          borderColor="#ffffff"
                          glyphColor="#ffffff"
                        />
                      </AdvancedMarker>
                    ))}

                  {selectedEntry && selectedEntry.hasCoords && (
                    <InfoWindow
                      position={{ lat: selectedEntry.lat!, lng: selectedEntry.lng! }}
                      onCloseClick={() => setActiveEmpId(null)}
                    >
                      <div className="text-slate-900 text-xs space-y-1 min-w-[180px]">
                        <div className="font-bold">{selectedEntry.employee.fullName}</div>
                        <div className="font-mono text-[11px] text-slate-600">
                          {selectedEntry.employee.badgeCode} · {selectedEntry.employee.roleTitle}
                        </div>
                        <div className="font-mono text-[11px]">
                          {formatCoordinates(selectedEntry.lat, selectedEntry.lng)}
                        </div>
                        {selectedEntry.geo && (
                          <div
                            className={`font-semibold text-[11px] ${
                              selectedEntry.isOutside ? 'text-rose-700' : 'text-emerald-700'
                            }`}
                          >
                            {selectedEntry.isOutside
                              ? `Outside geofence (${formatDistanceMeters(selectedEntry.geo.distanceMeters, 'en')})`
                              : `Inside perimeter (${formatDistanceMeters(selectedEntry.geo.distanceMeters, 'en')})`}
                          </div>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </APIProvider>
            </div>
          ) : (
            /* Coordinate Telemetry Radar Panel when VITE_GOOGLE_MAPS_API_KEY is not injected in static/test builds */
            <div
              data-testid="employee-map-tracker-fallback"
              className="min-h-[340px] rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col justify-between gap-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-300">
                  <Compass className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {isAr ? 'لوحة الإحداثيات الجغرافية الحية' : 'Live Coordinate Telemetry View'}
                  </span>
                </div>
                <span className="rounded border border-slate-700 bg-slate-900 px-2 py-0.5 font-mono text-[10px] text-slate-300 tabular-nums">
                  {site.lat.toFixed(4)}, {site.lng.toFixed(4)} · R={site.geofenceRadiusMeters}m
                </span>
              </div>

              {trackedEmployees.filter(t => t.hasCoords).length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <MapPin className="w-7 h-7 text-slate-600 mx-auto" aria-hidden="true" />
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? 'لا توجد إحداثيات GPS مسجلة للفنيين بعد. استخدم بوابة الحضور أو زر تحديث الموقع لتحديد الموقع.'
                      : 'No GPS coordinates recorded for technicians yet. Use the Time-Clock Portal or location ping to record coordinates.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {trackedEmployees
                    .filter(t => t.hasCoords)
                    .map(item => (
                      <div
                        key={item.employee.id}
                        className={`rounded-lg border p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          item.isOutside
                            ? 'border-rose-500/40 bg-rose-950/20'
                            : 'border-emerald-500/30 bg-emerald-950/15'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 text-xs font-bold text-white">
                            <MapPin
                              className={`w-3.5 h-3.5 shrink-0 ${
                                item.isOutside ? 'text-rose-400' : 'text-emerald-400'
                              }`}
                              aria-hidden="true"
                            />
                            <span>{item.employee.fullName}</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {item.employee.badgeCode}
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-300 tabular-nums">
                            GPS: {formatCoordinates(item.lat, item.lng)}
                            {item.geo &&
                              ` · ${formatDistanceMeters(item.geo.distanceMeters, language)} ${
                                isAr ? 'من المركز' : 'from site center'
                              }`}
                          </div>
                        </div>

                        <span
                          className={`rounded border px-2 py-0.5 text-[11px] font-bold self-start sm:self-center whitespace-nowrap ${
                            item.isOutside
                              ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                              : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                          }`}
                        >
                          {item.isOutside
                            ? isAr
                              ? 'خارج النطاق المحدد'
                              : 'Outside Geofence'
                            : isAr
                              ? 'داخل نطاق المشروع'
                              : 'Inside Geofence'}
                        </span>
                      </div>
                    ))}
                </div>
              )}

              <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-[11px] text-slate-400">
                {isAr
                  ? 'ملاحظة: يتم تفعيل الخريطة التفاعلية الكاملة عبر Google Maps بمجرد توفر مفتاح VITE_GOOGLE_MAPS_API_KEY في إعدادات التشغيل.'
                  : 'Note: Full interactive Google Maps rendering activates automatically when VITE_GOOGLE_MAPS_API_KEY is configured.'}
              </div>
            </div>
          )}
        </div>

        {/* Side Technician Roster & Coordinate Controls */}
        <div className="xl:col-span-5 space-y-2.5 max-h-[380px] overflow-y-auto pe-1">
          {employees.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/60 p-6 text-center text-xs text-slate-400">
              {isAr
                ? 'لم يتم تسجيل فنيين أو مفتشين تحت هذه الشركة بعد.'
                : 'No field technicians enrolled under this company yet.'}
            </div>
          ) : (
            trackedEmployees.map(item => {
              const selected = activeEmpId === item.employee.id;
              return (
                <div
                  key={item.employee.id}
                  onClick={() => setActiveEmpId(item.employee.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setActiveEmpId(item.employee.id);
                    }
                  }}
                  className={`rounded-xl border p-3.5 transition cursor-pointer space-y-2 ${
                    selected
                      ? 'border-cyan-500 bg-cyan-950/20'
                      : item.isOutside
                        ? 'border-rose-500/40 bg-slate-950/80 hover:border-rose-400/60'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white truncate">
                        {item.employee.fullName}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {item.employee.badgeCode} · {item.employee.roleTitle}
                      </div>
                    </div>
                    <span
                      className={`rounded border px-2 py-0.5 text-[10px] font-bold shrink-0 whitespace-nowrap ${
                        item.isOutside
                          ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                          : item.employee.onlineStatus === 'on_site'
                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                            : 'border-slate-700 bg-slate-800 text-slate-300'
                      }`}
                    >
                      {statusLabel(item.employee.onlineStatus, item.isOutside)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums text-slate-300">
                    <span className="inline-flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-cyan-400" aria-hidden="true" />
                      {formatCoordinates(item.lat, item.lng)}
                    </span>
                    {item.geo && (
                      <span className={item.isOutside ? 'text-rose-300 font-bold' : 'text-emerald-300'}>
                        {formatDistanceMeters(item.geo.distanceMeters, language)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[11px]">
                    <span className="inline-flex items-center gap-1 text-slate-400">
                      <ShieldCheck
                        className={`w-3.5 h-3.5 ${
                          item.employee.faceEnrolled ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                        aria-hidden="true"
                      />
                      {item.employee.faceEnrolled
                        ? isAr
                          ? 'بصمة الوجه مسجلة'
                          : 'Face Enrolled'
                        : isAr
                          ? 'بدون بصمة وجه'
                          : 'Face Not Enrolled'}
                    </span>

                    {onRequestLocationUpdate && (
                      <button
                        type="button"
                        disabled={isUpdatingLocation}
                        onClick={e => {
                          e.stopPropagation();
                          onRequestLocationUpdate(item.employee);
                        }}
                        className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-cyan-300 cursor-pointer whitespace-nowrap"
                      >
                        <RefreshCw className="w-3 h-3" aria-hidden="true" />
                        <span>{isAr ? 'تحديث GPS' : 'Update GPS'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
