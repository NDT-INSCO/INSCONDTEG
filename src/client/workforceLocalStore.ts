import { evaluateGeofence } from './geofencing';
import type {
  AttendanceEventType,
  AttendanceLog,
  CompanyEmployee,
  CompanyRecord,
  VerificationMethod,
} from './types';

export const LOCAL_WORKFORCE_STORAGE_KEY = 'insco_workforce_preview_v1';
export const LOCAL_WORKFORCE_EVENT = 'insco:workforce-updated';

export interface LocalWorkforceSnapshot {
  company: CompanyRecord;
  employees: CompanyEmployee[];
  logs: AttendanceLog[];
}

function buildDefaultSnapshot(): LocalWorkforceSnapshot {
  const siteLat = 31.5453;
  const siteLng = 31.0872;
  const radius = 500;
  const companyId = 'insco-burullus-site';
  const companyCode = 'INS-CO-0101';

  const company: CompanyRecord = {
    id: companyId,
    companyCode,
    nameAr: 'محطة كهرباء البرلس 4800 ميجاوات — الموقع الميداني',
    nameEn: 'Burullus 4800 MW Power Plant — Field Operations',
    archiveCategory: 'active_testing',
    hasActiveTestingDossier: true,
    sector: 'Power Generation & Energy',
    projectLocation: 'Kafr El-Sheikh / Burullus, Egypt',
    assignedClientUid: '',
    reportsCount: 4,
    siteLat,
    siteLng,
    geofenceRadiusMeters: radius,
    createdByUid: 'preview-system',
  };

  const now = Date.now();
  const isoAgo = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();

  const employees: CompanyEmployee[] = [
    {
      id: 'emp-01',
      companyId,
      companyCode,
      ownerUid: 'preview-system',
      fullName: 'Eng. Karim El-Mansoury',
      roleTitle: 'Senior PAUT / RT Level III Inspector',
      badgeCode: 'EMP-101',
      phone: '+20 100 555 0101',
      faceEnrolled: true,
      faceDigest: 'FC-9A21C044-11B8E209',
      lastLat: 31.5461,
      lastLng: 31.0881,
      lastSeenAt: isoAgo(12),
      onlineStatus: 'on_site',
    },
    {
      id: 'emp-02',
      companyId,
      companyCode,
      ownerUid: 'preview-system',
      fullName: 'Tech. Mahmoud Abdelrahman',
      roleTitle: 'PWHT Heat Treatment Operator',
      badgeCode: 'EMP-102',
      phone: '+20 100 555 0102',
      faceEnrolled: true,
      faceDigest: 'FC-7B40A119-4C81D002',
      lastLat: 31.5446,
      lastLng: 31.0865,
      lastSeenAt: isoAgo(38),
      onlineStatus: 'on_site',
    },
    {
      id: 'emp-03',
      companyId,
      companyCode,
      ownerUid: 'preview-system',
      fullName: 'Tech. Salma Nabil',
      roleTitle: 'MT / PT Surface Inspection Technician',
      badgeCode: 'EMP-103',
      phone: '+20 100 555 0103',
      faceEnrolled: true,
      faceDigest: 'FC-4E12F883-90D2A310',
      lastLat: 31.5618,
      lastLng: 31.1014,
      lastSeenAt: isoAgo(5),
      onlineStatus: 'alert',
    },
  ];

  const eval1 = evaluateGeofence({
    workerLat: 31.5461,
    workerLng: 31.0881,
    siteLat,
    siteLng,
    radiusMeters: radius,
  });
  const eval2 = evaluateGeofence({
    workerLat: 31.5446,
    workerLng: 31.0865,
    siteLat,
    siteLng,
    radiusMeters: radius,
  });
  const eval3 = evaluateGeofence({
    workerLat: 31.5618,
    workerLng: 31.1014,
    siteLat,
    siteLng,
    radiusMeters: radius,
  });

  const logs: AttendanceLog[] = [
    {
      id: 'att-03',
      companyId,
      companyCode,
      ownerUid: 'preview-system',
      employeeId: 'emp-03',
      employeeName: 'Tech. Salma Nabil',
      workerUid: 'preview-worker-03',
      eventType: 'check_in',
      lat: 31.5618,
      lng: 31.1014,
      accuracyMeters: 14,
      distanceFromSiteMeters: eval3.distanceMeters,
      geofenceRadiusMeters: radius,
      geofenceStatus: eval3.status,
      faceVerified: true,
      faceSnapshotHash: 'FC-4E12F883-90D2A310',
      verificationMethod: 'face_gps',
      deviceLabel: 'Field Tablet #3 (GPS)',
      notes: 'Remote sector mobilization check-in outside primary turbine perimeter.',
      timestampIso: isoAgo(5),
    },
    {
      id: 'att-01',
      companyId,
      companyCode,
      ownerUid: 'preview-system',
      employeeId: 'emp-01',
      employeeName: 'Eng. Karim El-Mansoury',
      workerUid: 'preview-worker-01',
      eventType: 'check_in',
      lat: 31.5461,
      lng: 31.0881,
      accuracyMeters: 8,
      distanceFromSiteMeters: eval1.distanceMeters,
      geofenceRadiusMeters: radius,
      geofenceStatus: eval1.status,
      faceVerified: true,
      faceSnapshotHash: 'FC-9A21C044-11B8E209',
      verificationMethod: 'face_gps',
      deviceLabel: 'Inspector Mobile GPS',
      notes: 'Morning shift check-in at HP Steam Header Zone.',
      timestampIso: isoAgo(12),
    },
    {
      id: 'att-02',
      companyId,
      companyCode,
      ownerUid: 'preview-system',
      employeeId: 'emp-02',
      employeeName: 'Tech. Mahmoud Abdelrahman',
      workerUid: 'preview-worker-02',
      eventType: 'check_in',
      lat: 31.5446,
      lng: 31.0865,
      accuracyMeters: 11,
      distanceFromSiteMeters: eval2.distanceMeters,
      geofenceRadiusMeters: radius,
      geofenceStatus: eval2.status,
      faceVerified: true,
      faceSnapshotHash: 'FC-7B40A119-4C81D002',
      verificationMethod: 'face_gps',
      deviceLabel: 'PWHT Unit Tablet #04',
      notes: 'Rigged 65kW console for Weld W-24 stress relief.',
      timestampIso: isoAgo(38),
    },
    {
      id: 'att-00',
      companyId,
      companyCode,
      ownerUid: 'preview-system',
      employeeId: 'emp-02',
      employeeName: 'Tech. Mahmoud Abdelrahman',
      workerUid: 'preview-worker-02',
      eventType: 'check_out',
      lat: 31.5451,
      lng: 31.0870,
      accuracyMeters: 9,
      distanceFromSiteMeters: 29,
      geofenceRadiusMeters: radius,
      geofenceStatus: 'inside_geofence',
      faceVerified: true,
      faceSnapshotHash: 'FC-7B40A119-4C81D002',
      verificationMethod: 'face_gps',
      deviceLabel: 'PWHT Unit Tablet #04',
      notes: 'Completed night thermal cycle shift.',
      timestampIso: isoAgo(420),
    },
  ];

  return { company, employees, logs };
}

export function getLocalWorkforceSnapshot(): LocalWorkforceSnapshot {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(LOCAL_WORKFORCE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as LocalWorkforceSnapshot;
        if (parsed && parsed.company && Array.isArray(parsed.employees) && Array.isArray(parsed.logs)) {
          return parsed;
        }
      }
    }
  } catch {
    /* ignore corrupt storage */
  }
  return buildDefaultSnapshot();
}

function saveSnapshot(snapshot: LocalWorkforceSnapshot): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOCAL_WORKFORCE_STORAGE_KEY, JSON.stringify(snapshot));
    }
    if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent(LOCAL_WORKFORCE_EVENT, { detail: snapshot }));
    }
  } catch {
    /* ignore private mode errors */
  }
}

export function recordLocalAttendanceEvent(params: {
  employeeId: string;
  eventType: AttendanceEventType;
  lat: number;
  lng: number;
  accuracyMeters?: number;
  faceVerified: boolean;
  faceSnapshotHash?: string;
  verificationMethod: VerificationMethod;
  notes?: string;
}): { snapshot: LocalWorkforceSnapshot; log: AttendanceLog } {
  const current = getLocalWorkforceSnapshot();
  const employee =
    current.employees.find(e => e.id === params.employeeId) ?? current.employees[0];
  const siteLat = current.company.siteLat ?? 31.5453;
  const siteLng = current.company.siteLng ?? 31.0872;
  const radius = current.company.geofenceRadiusMeters ?? 500;
  const evaluation = evaluateGeofence({
    workerLat: params.lat,
    workerLng: params.lng,
    siteLat,
    siteLng,
    radiusMeters: radius,
  });
  const timestampIso = new Date().toISOString();

  const log: AttendanceLog = {
    id: `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    companyId: current.company.id,
    companyCode: current.company.companyCode,
    ownerUid: current.company.createdByUid,
    employeeId: employee.id,
    employeeName: employee.fullName,
    workerUid: employee.workerUid ?? employee.id,
    eventType: params.eventType,
    lat: params.lat,
    lng: params.lng,
    accuracyMeters: params.accuracyMeters ?? 10,
    distanceFromSiteMeters: evaluation.distanceMeters,
    geofenceRadiusMeters: evaluation.radiusMeters,
    geofenceStatus: evaluation.status,
    faceVerified: params.faceVerified,
    faceSnapshotHash: params.faceSnapshotHash ?? employee.faceDigest,
    verificationMethod: params.verificationMethod,
    deviceLabel: 'Field GPS Check-In',
    notes: params.notes,
    timestampIso,
  };

  const nextStatus =
    evaluation.status === 'outside_geofence' && params.eventType === 'check_in'
      ? 'alert'
      : params.eventType === 'check_in'
        ? 'on_site'
        : 'off_duty';

  const updatedEmployees = current.employees.map(emp =>
    emp.id === employee.id
      ? {
          ...emp,
          lastLat: params.lat,
          lastLng: params.lng,
          lastSeenAt: timestampIso,
          onlineStatus: nextStatus as CompanyEmployee['onlineStatus'],
        }
      : emp
  );

  const nextSnapshot: LocalWorkforceSnapshot = {
    company: current.company,
    employees: updatedEmployees,
    logs: [log, ...current.logs].slice(0, 60),
  };
  saveSnapshot(nextSnapshot);
  return { snapshot: nextSnapshot, log };
}

export function resetLocalWorkforceSnapshot(): LocalWorkforceSnapshot {
  const initial = buildDefaultSnapshot();
  saveSnapshot(initial);
  return initial;
}

export function subscribeLocalWorkforceEvents(
  listener: (snapshot: LocalWorkforceSnapshot) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const onEvent = () => listener(getLocalWorkforceSnapshot());
  window.addEventListener(LOCAL_WORKFORCE_EVENT, onEvent);
  window.addEventListener('storage', onEvent);
  return () => {
    window.removeEventListener(LOCAL_WORKFORCE_EVENT, onEvent);
    window.removeEventListener('storage', onEvent);
  };
}
