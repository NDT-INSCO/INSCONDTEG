import {
  AGENT_ENDPOINTS,
  CommunityAssistRequest,
  CommunityAssistResponse,
  SiteManagerRequest,
  SiteManagerResponse,
  UserCopilotRequest,
  UserCopilotResponse,
} from './agentsContract';
import { gatewayBase } from './client';
import { isStaticPages } from '../utils/staticPages';

export function agentUrl(path: string): string {
  return `${gatewayBase()}${path}`;
}

export class AgentApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code = 'agent_error') {
    super(message);
    this.name = 'AgentApiError';
    this.status = status;
    this.code = code;
  }
}

async function postAgentJson<TReq, TRes>(
  endpoint: string,
  payload: TReq,
  signal?: AbortSignal
): Promise<TRes> {
  // A static GitHub Pages build ships no gateway at all: say so honestly instead
  // of firing a request that can never answer. Same posture as the tutor.
  if (!gatewayBase() && isStaticPages()) {
    throw new AgentApiError(
      'The AI agents require the INSCO AI gateway. This site is a static build without a gateway attached.',
      503,
      'not_configured'
    );
  }

  const res = await fetch(agentUrl(endpoint), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string };
  } & TRes;

  if (!res.ok) {
    // Say what actually happened. A 404 means the route is not deployed (the site once
    // blamed the API key for exactly this), and only `not_configured` is a key problem.
    const code = data?.error?.code || 'agent_error';
    const msg =
      data?.error?.message ||
      (res.status === 404
        ? 'The AI route is not deployed on this domain (HTTP 404).'
        : code === 'not_configured'
          ? 'No GEMINI_API_KEY on the server that hosts /api/ai/*.'
          : `AI service unavailable (HTTP ${res.status}).`);
    throw new AgentApiError(msg, res.status, code);
  }

  return data as TRes;
}

export function askUserCopilot(
  request: UserCopilotRequest,
  signal?: AbortSignal
): Promise<UserCopilotResponse> {
  return postAgentJson<UserCopilotRequest, UserCopilotResponse>(
    AGENT_ENDPOINTS.userCopilot,
    request,
    signal
  );
}

export function runSiteManagerAgent(
  request: SiteManagerRequest,
  signal?: AbortSignal
): Promise<SiteManagerResponse> {
  return postAgentJson<SiteManagerRequest, SiteManagerResponse>(
    AGENT_ENDPOINTS.siteManager,
    request,
    signal
  );
}

export function runCommunityAssist(
  request: CommunityAssistRequest,
  signal?: AbortSignal
): Promise<CommunityAssistResponse> {
  return postAgentJson<CommunityAssistRequest, CommunityAssistResponse>(
    AGENT_ENDPOINTS.communityAssist,
    request,
    signal
  );
}
