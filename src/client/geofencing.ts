import type { GeofenceStatus } from './types';

const EARTH_RADIUS_METERS = 6_371_000;

export const DEFAULT_SITE_COORDS = {
  lat: 31.5453,
  lng: 31.0872,
  geofenceRadiusMeters: 500,
} as const;

export interface GeofenceEvaluation {
  distanceMeters: number;
  radiusMeters: number;
  status: GeofenceStatus;
  exceededByMeters: number;
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Computes great-circle distance between two WGS-84 coordinates using Haversine.
 */
export function calculateDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  if (
    !Number.isFinite(lat1) ||
    !Number.isFinite(lng1) ||
    !Number.isFinite(lat2) ||
    !Number.isFinite(lng2)
  ) {
    return 0;
  }
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Evaluates whether a field technician's coordinates fall inside the project geofence perimeter.
 */
export function evaluateGeofence(params: {
  workerLat: number;
  workerLng: number;
  siteLat: number;
  siteLng: number;
  radiusMeters?: number;
}): GeofenceEvaluation {
  const radiusMeters = Math.max(
    50,
    Math.min(50_000, Math.round(params.radiusMeters ?? DEFAULT_SITE_COORDS.geofenceRadiusMeters))
  );
  const distanceMeters = calculateDistanceMeters(
    params.workerLat,
    params.workerLng,
    params.siteLat,
    params.siteLng
  );
  const status: GeofenceStatus =
    distanceMeters <= radiusMeters ? 'inside_geofence' : 'outside_geofence';
  return {
    distanceMeters,
    radiusMeters,
    status,
    exceededByMeters: Math.max(0, distanceMeters - radiusMeters),
  };
}

export function formatDistanceMeters(meters: number, language: 'ar' | 'en'): string {
  const rounded = Math.max(0, Math.round(meters));
  if (rounded >= 1000) {
    const km = (rounded / 1000).toFixed(2);
    return language === 'ar' ? `${km} كم` : `${km} km`;
  }
  return language === 'ar' ? `${rounded} م` : `${rounded} m`;
}

export function formatCoordinates(lat?: number, lng?: number): string {
  if (typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return '—';
  }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

/**
 * Derives deterministic default site coordinates from a project location label when explicit lat/lng are unset.
 */
export function resolveSiteCoordinates(company: {
  siteLat?: number;
  siteLng?: number;
  geofenceRadiusMeters?: number;
  projectLocation?: string;
}): { lat: number; lng: number; geofenceRadiusMeters: number } {
  if (
    typeof company.siteLat === 'number' &&
    Number.isFinite(company.siteLat) &&
    typeof company.siteLng === 'number' &&
    Number.isFinite(company.siteLng)
  ) {
    return {
      lat: company.siteLat,
      lng: company.siteLng,
      geofenceRadiusMeters: Math.max(
        50,
        Math.min(50_000, company.geofenceRadiusMeters ?? DEFAULT_SITE_COORDS.geofenceRadiusMeters)
      ),
    };
  }

  const loc = (company.projectLocation ?? '').toLowerCase();
  if (loc.includes('suez') || loc.includes('السويس')) {
    return { lat: 29.9668, lng: 32.5498, geofenceRadiusMeters: company.geofenceRadiusMeters ?? 600 };
  }
  if (loc.includes('alex') || loc.includes('الإسكندرية') || loc.includes('عامرية')) {
    return { lat: 31.2001, lng: 29.9187, geofenceRadiusMeters: company.geofenceRadiusMeters ?? 600 };
  }
  if (loc.includes('cairo') || loc.includes('maadi') || loc.includes('القاهرة') || loc.includes('المعادي')) {
    return { lat: 29.9602, lng: 31.2569, geofenceRadiusMeters: company.geofenceRadiusMeters ?? 500 };
  }
  if (loc.includes('capital') || loc.includes('العاصمة')) {
    return { lat: 30.0131, lng: 31.7375, geofenceRadiusMeters: company.geofenceRadiusMeters ?? 750 };
  }
  if (loc.includes('yemen') || loc.includes('hadhramaut') || loc.includes('اليمن')) {
    return { lat: 15.9571, lng: 48.7867, geofenceRadiusMeters: company.geofenceRadiusMeters ?? 1000 };
  }
  return {
    lat: DEFAULT_SITE_COORDS.lat,
    lng: DEFAULT_SITE_COORDS.lng,
    geofenceRadiusMeters: company.geofenceRadiusMeters ?? DEFAULT_SITE_COORDS.geofenceRadiusMeters,
  };
}
