import React, { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Clock, MapPin, Navigation, RotateCcw } from 'lucide-react';
import type { Language } from '../../types';
import type { AttendanceLog, CompanyRecord } from '../../client/types';
import {
  observeClientPortalAuth,
  isVerifiedAdminUser,
  isPortalFirestoreReady,
  subscribeCompanies,
  subscribeCompanyAttendance,
} from '../../client/firestoreClientService';
import {
  getLocalWorkforceSnapshot,
  recordLocalAttendanceEvent,
  resetLocalWorkforceSnapshot,
  subscribeLocalWorkforceEvents,
  type LocalWorkforceSnapshot,
} from '../../client/workforceLocalStore';
import { EmployeeAttendanceTimeline } from '../client/EmployeeAttendanceTimeline';

interface CompanyAttendanceTimelineSectionProps {
  language: Language;
  onOpenTimeClockPortal?: () => void;
  onOpenCompaniesPortal?: () => void;
}

export const CompanyAttendanceTimelineSection: React.FC<CompanyAttendanceTimelineSectionProps> = ({
  language,
  onOpenTimeClockPortal,
  onOpenCompaniesPortal,
}) => {
  const isAr = language === 'ar';

  const [localSnapshot, setLocalSnapshot] = useState<LocalWorkforceSnapshot>(() =>
    getLocalWorkforceSnapshot()
  );
  const [liveCompany, setLiveCompany] = useState<CompanyRecord | null>(null);
  const [liveLogs, setLiveLogs] = useState<AttendanceLog[]>([]);
  const [usingLiveFirestore, setUsingLiveFirestore] = useState(false);

  useEffect(() => {
    const unsubLocal = subscribeLocalWorkforceEvents(setLocalSnapshot);
    return unsubLocal;
  }, []);

  useEffect(() => {
    if (!isPortalFirestoreReady()) return;
    let unsubCompanies: (() => void) | undefined;
    let unsubAttendance: (() => void) | undefined;

    const unsubAuth = observeClientPortalAuth(user => {
      unsubCompanies?.();
      unsubAttendance?.();
      if (!user) {
        setUsingLiveFirestore(false);
        setLiveCompany(null);
        setLiveLogs([]);
        return;
      }

      const isAdmin = isVerifiedAdminUser(user);
      unsubCompanies = subscribeCompanies(
        user.uid,
        isAdmin,
        companies => {
          const primary = companies[0] ?? null;
          setLiveCompany(primary);
          unsubAttendance?.();
          if (primary) {
            unsubAttendance = subscribeCompanyAttendance(
              primary.id,
              user.uid,
              isAdmin,
              logs => {
                if (logs.length > 0) {
                  setLiveLogs(logs);
                  setUsingLiveFirestore(true);
                } else {
                  setLiveLogs([]);
                  setUsingLiveFirestore(false);
                }
              },
              () => {
                setUsingLiveFirestore(false);
              }
            );
          }
        },
        () => {
          setUsingLiveFirestore(false);
        }
      );
    });

    return () => {
      unsubAuth();
      unsubCompanies?.();
      unsubAttendance?.();
    };
  }, []);

  const displayedLogs = useMemo(
    () => (usingLiveFirestore && liveLogs.length > 0 ? liveLogs : localSnapshot.logs),
    [usingLiveFirestore, liveLogs, localSnapshot.logs]
  );

  const displayedCompany = useMemo(
    () => (usingLiveFirestore && liveCompany ? liveCompany : localSnapshot.company),
    [usingLiveFirestore, liveCompany, localSnapshot.company]
  );

  const handleSimulatePunch = (mode: 'inside' | 'outside', eventType: 'check_in' | 'check_out') => {
    const siteLat = displayedCompany.siteLat ?? 31.5453;
    const siteLng = displayedCompany.siteLng ?? 31.0872;
    const emp = localSnapshot.employees[0];
    recordLocalAttendanceEvent({
      employeeId: emp.id,
      eventType,
      lat: mode === 'inside' ? siteLat + 0.0004 : siteLat + 0.022,
      lng: mode === 'inside' ? siteLng + 0.0004 : siteLng + 0.019,
      faceVerified: true,
      verificationMethod: 'face_gps',
      notes:
        mode === 'outside'
          ? isAr
            ? 'تسجيل دخول ميداني خارج نطاق المشروع (تجربة تنبيه إداري)'
            : 'Field check-in recorded outside project geofence perimeter'
          : isAr
            ? 'تسجيل داخل النطاق المعتمد لموقع المشروع'
            : 'Checked inside authorized project perimeter',
    });
  };

  return (
    <section
      id="field-attendance-timeline"
      data-testid="company-attendance-timeline-section"
      className="py-12 border-t border-slate-800/80 bg-slate-950/60"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-cyan-400">
              <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {isAr
                  ? 'المتابعة الميدانية · الخرائط والجدول الزمني'
                  : 'Field Operations · Geofenced Attendance Timeline'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {isAr
                ? 'الجدول الزمني لدخول وخروج الموظفين الميدانيين وتنبيهات النطاق الجغرافي'
                : 'Field Crew Check-In/Out Timeline & Geofencing Alerts'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              {usingLiveFirestore
                ? isAr
                  ? `عرض مباشر من سجل الشركة المرتبط بحسابك (${displayedCompany.companyCode}).`
                  : `Live synced timeline from your linked company workspace (${displayedCompany.companyCode}).`
                : isAr
                  ? 'سجل تشغيلي تفاعلي بالإحداثيات الجغرافية لمحطة البرلس؛ يُصدر تنبيهاً إدارياً فورياً عند تسجيل الدخول خارج نطاق المشروع المحدد.'
                  : 'Interactive GPS coordinate timeline preview; automatically triggers an Admin Geofencing Alert when any check-in falls outside the project perimeter.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!usingLiveFirestore && (
              <>
                <button
                  type="button"
                  onClick={() => handleSimulatePunch('inside', 'check_in')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300 cursor-pointer whitespace-nowrap"
                >
                  <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isAr ? 'تجربة دخول داخل النطاق' : 'Test Inside Check-In'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSimulatePunch('outside', 'check_in')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-300 cursor-pointer whitespace-nowrap"
                >
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>{isAr ? 'تجربة دخول خارج النطاق' : 'Test Outside Alert'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => resetLocalWorkforceSnapshot()}
                  aria-label={isAr ? 'إعادة ضبط البيانات التفاعلية' : 'Reset preview log'}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-300 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </>
            )}

            {onOpenTimeClockPortal && (
              <button
                type="button"
                onClick={onOpenTimeClockPortal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 px-3.5 py-1.5 text-xs font-black text-slate-950 cursor-pointer whitespace-nowrap"
              >
                <BriefcaseBusiness className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAr ? 'بوابة تسجيل حضور الأفراد' : 'Worker Time-Clock Portal'}</span>
              </button>
            )}

            {onOpenCompaniesPortal && (
              <button
                type="button"
                onClick={onOpenCompaniesPortal}
                className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 px-3.5 py-1.5 text-xs font-bold text-cyan-300 cursor-pointer whitespace-nowrap"
              >
                <span>{isAr ? 'خرائط الشركات والملفات ←' : 'Companies & Live Maps →'}</span>
              </button>
            )}
          </div>
        </div>

        <EmployeeAttendanceTimeline
          language={language}
          logs={displayedLogs}
          companyName={isAr ? displayedCompany.nameAr : displayedCompany.nameEn}
          companyCode={displayedCompany.companyCode}
        />
      </div>
    </section>
  );
};
