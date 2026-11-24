/**
 * Browser client for «جامعة إنسكو الروبوتية». Mirrors the tutor client's
 * honesty posture: on the static GitHub Pages build there is no gateway, so
 * dynamic calls fail with `not_configured` before a byte hits the network,
 * and the UI keeps showing the reviewed archive bundled with the app.
 */
import {
  UNIVERSITY_ENDPOINTS,
  type UniversityArchiveResponse,
  type UniversityCollectRequest,
  type UniversityCollectResponse,
  type UniversityOrganizeRequest,
  type UniversityOrganizeResponse,
  type UniversityStatus,
  type UniversitySynthesizeRequest,
  type UniversitySynthesizeResponse,
  type UniversityTeachRequest,
  type UniversityTeachResponse,
} from './universityContract';
import { gatewayBase } from './client';
import { isStaticPages } from '../utils/staticPages';

export class UniversityApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = 'university_error') {
    super(message);
    this.name = 'UniversityApiError';
    this.status = status;
    this.code = code;
  }
}

export function universityUrl(path: string): string {
  return `${gatewayBase()}${path}`;
}

const offlineStatus = (note: UniversityStatus['mode'] = 'not_configured'): UniversityStatus => ({
  configured: false,
  mode: note,
  model: null,
  runtimeRecords: 0,
  version: 'university-1',
});

const staticHost = (): boolean => !gatewayBase() && isStaticPages();

export async function fetchUniversityStatus(timeoutMs = 2500): Promise<UniversityStatus> {
  if (staticHost()) return offlineStatus('not_configured');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(universityUrl(UNIVERSITY_ENDPOINTS.status), {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return offlineStatus('unreachable');
    const data = (await response.json()) as Partial<UniversityStatus>;
    if (typeof data?.configured !== 'boolean') return offlineStatus('unreachable');
    return {
      configured: data.configured,
      mode: data.mode === 'live' ? 'live' : 'not_configured',
      model: typeof data.model === 'string' ? data.model : null,
      runtimeRecords: typeof data.runtimeRecords === 'number' ? data.runtimeRecords : 0,
      version: typeof data.version === 'string' ? data.version : 'university-1',
    };
  } catch {
    return offlineStatus('unreachable');
  } finally {
    clearTimeout(timer);
  }
}

async function postUniversity<TReq, TRes>(
  endpoint: string,
  payload: TReq,
  signal?: AbortSignal
): Promise<TRes> {
  if (staticHost()) {
    throw new UniversityApiError(
      'The university gateway requires the INSCO AI server. This static build serves the reviewed archive only.',
      503,
      'not_configured'
    );
  }
  const response = await fetch(universityUrl(endpoint), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });
  const data = (await response.json().catch(() => ({}))) as Partial<TRes> & {
    error?: { code?: string; message?: string };
  };
  if (!response.ok) {
    const code = data?.error?.code || 'university_error';
    const message =
      data?.error?.message ||
      (response.status === 404
        ? 'The university route is not deployed on this domain (HTTP 404).'
        : `University service unavailable (HTTP ${response.status}).`);
    throw new UniversityApiError(message, response.status, code);
  }
  return data as TRes;
}

export const fetchUniversityArchive = async (signal?: AbortSignal): Promise<UniversityArchiveResponse> => {
  if (staticHost()) return { ok: true, records: [], persisted: false };
  const response = await fetch(universityUrl(UNIVERSITY_ENDPOINTS.archive), {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new UniversityApiError(`Archive unavailable (HTTP ${response.status}).`, response.status);
  }
  return (await response.json()) as UniversityArchiveResponse;
};

export const collectDocumentedKnowledge = (
  request: UniversityCollectRequest,
  signal?: AbortSignal
): Promise<UniversityCollectResponse> =>
  postUniversity<UniversityCollectRequest, UniversityCollectResponse>(
    UNIVERSITY_ENDPOINTS.collect,
    request,
    signal
  );

export const synthesizeDepartment = (
  request: UniversitySynthesizeRequest,
  signal?: AbortSignal
): Promise<UniversitySynthesizeResponse> =>
  postUniversity<UniversitySynthesizeRequest, UniversitySynthesizeResponse>(
    UNIVERSITY_ENDPOINTS.synthesize,
    request,
    signal
  );

export const organizeArchive = (
  request: UniversityOrganizeRequest,
  signal?: AbortSignal
): Promise<UniversityOrganizeResponse> =>
  postUniversity<UniversityOrganizeRequest, UniversityOrganizeResponse>(
    UNIVERSITY_ENDPOINTS.organize,
    request,
    signal
  );

export const buildAgentTeachingPack = (
  request: UniversityTeachRequest,
  signal?: AbortSignal
): Promise<UniversityTeachResponse> =>
  postUniversity<UniversityTeachRequest, UniversityTeachResponse>(
    UNIVERSITY_ENDPOINTS.teach,
    request,
    signal
  );
