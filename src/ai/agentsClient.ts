import {
  AGENT_ENDPOINTS,
  CommunityAssistRequest,
  CommunityAssistResponse,
  SiteManagerRequest,
  SiteManagerResponse,
  UserCopilotRequest,
  UserCopilotResponse,
} from './agentsContract';

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
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  const data = (await res.json().catch(() => ({}))) as {
    error?: { code?: string; message?: string };
  } & TRes;

  if (!res.ok) {
    const msg =
      data?.error?.message ||
      `AI service unavailable (HTTP ${res.status}). Ensure GEMINI_API_KEY is configured on the server.`;
    throw new AgentApiError(msg, res.status, data?.error?.code || 'agent_error');
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
