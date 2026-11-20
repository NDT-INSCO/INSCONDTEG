import type { SiteTelemetrySnapshot } from './agentsContract';
import { getLocalWorkforceSnapshot } from '../client/workforceLocalStore';

export const INSCO_TELEMETRY_EVENT = 'insco:telemetry-updated';
export const INSCO_APPLY_POST_DRAFT_EVENT = 'insco:apply-post-draft';
export const INSCO_OPEN_AI_DOCK_EVENT = 'insco:open-ai-dock';

export interface PostDraftDetail {
  postType: 'technical_case' | 'job_tender' | 'discussion' | 'equipment_review';
  ndtMethod: string;
  title: string;
  body: string;
  tags: string[];
}

export interface OpenAiDockDetail {
  agent?: 'copilot' | 'manager';
  prompt?: string;
}

function defaultTelemetry(): SiteTelemetrySnapshot {
  const localWf = getLocalWorkforceSnapshot();
  const outsideLogs = localWf.logs.filter(l => l.geofenceStatus === 'outside_geofence');
  return {
    totalRequests: 0,
    newRequests: 0,
    urgentRequests: 0,
    totalCompanies: 1,
    activeTestingCompanies: localWf.company.hasActiveTestingDossier ? 1 : 0,
    pendingAccounts: 0,
    geofenceAlertCount: outsideLogs.length,
    recentGeofenceAlerts: outsideLogs.slice(0, 6).map(l => ({
      employeeName: l.employeeName,
      companyCode: l.companyCode,
      distanceMeters: l.distanceFromSiteMeters,
      radiusMeters: l.geofenceRadiusMeters,
      timestampIso: l.timestampIso,
    })),
    communityPostsCount: 0,
    communityMembersCount: 0,
    opportunitiesCount: 0,
    recentPosts: [],
    currentRoute: typeof window !== 'undefined' ? window.location.hash || '#company' : '#company',
  };
}

let currentTelemetry: SiteTelemetrySnapshot = defaultTelemetry();
const listeners = new Set<(snapshot: SiteTelemetrySnapshot) => void>();

export function getSiteTelemetrySnapshot(): SiteTelemetrySnapshot {
  return {
    ...currentTelemetry,
    currentRoute:
      typeof window !== 'undefined'
        ? window.location.hash || currentTelemetry.currentRoute || '#company'
        : currentTelemetry.currentRoute,
  };
}

export function publishSiteTelemetrySnapshot(partial: Partial<SiteTelemetrySnapshot>): void {
  const base = getSiteTelemetrySnapshot();
  currentTelemetry = {
    ...base,
    ...partial,
  };
  listeners.forEach(cb => cb(currentTelemetry));
  if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(new CustomEvent(INSCO_TELEMETRY_EVENT, { detail: currentTelemetry }));
  }
}

export function subscribeSiteTelemetry(
  listener: (snapshot: SiteTelemetrySnapshot) => void
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function dispatchApplyPostDraft(detail: PostDraftDetail): void {
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('insco_pending_post_draft_v1', JSON.stringify(detail));
    }
  } catch {
    /* ignore storage limits */
  }
  if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(new CustomEvent(INSCO_APPLY_POST_DRAFT_EVENT, { detail }));
  }
}

export function consumePendingPostDraft(): PostDraftDetail | null {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem('insco_pending_post_draft_v1');
    if (!raw) return null;
    sessionStorage.removeItem('insco_pending_post_draft_v1');
    return JSON.parse(raw) as PostDraftDetail;
  } catch {
    return null;
  }
}

export function dispatchOpenAiDock(detail: OpenAiDockDetail): void {
  if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(new CustomEvent(INSCO_OPEN_AI_DOCK_EVENT, { detail }));
  }
}
