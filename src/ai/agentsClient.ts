import {
  AGENT_ENDPOINTS,
  ChatGptStreamEvent,
  ChatGptStreamRequest,
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
  return isStaticPages() ? path : `${gatewayBase()}${path}`;
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
  if (isStaticPages()) {
    if (signal?.aborted) throw new DOMException('The operation was aborted.', 'AbortError');
    // Keep the three advertised agents keyless on static hosting too. The hosted
    // gateway remains available to the tutor and the separate ChatGPT workspace.
    const { answerCopilot, answerSiteManager, answerCommunity } = await import('./agentBrain');
    const result = endpoint === AGENT_ENDPOINTS.userCopilot
      ? answerCopilot(payload as UserCopilotRequest)
      : endpoint === AGENT_ENDPOINTS.siteManager
        ? answerSiteManager(payload as SiteManagerRequest)
        : answerCommunity(payload as CommunityAssistRequest);
    return result as TRes;
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const { auth } = await import('../firebase/config');
    const idToken = await auth?.currentUser?.getIdToken();
    if (idToken) headers.Authorization = `Bearer ${idToken}`;
  } catch {
    // Public corpus/rules remain usable when Firebase Auth is absent.
  }

  const res = await fetch(agentUrl(endpoint), {
    method: 'POST',
    headers,
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

export interface ChatGptStreamHandlers {
  onEvent: (event: ChatGptStreamEvent) => void;
}

export async function streamChatGptAgent(
  request: ChatGptStreamRequest,
  handlers: ChatGptStreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${gatewayBase()}${AGENT_ENDPOINTS.chatgptStream}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal,
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as {
      error?: { code?: string; message?: string };
    };
    const msg =
      errBody?.error?.message ||
      `AI service unavailable (HTTP ${res.status}). Ensure GEMINI_API_KEY is configured on the server.`;
    throw new AgentApiError(msg, res.status, errBody?.error?.code || 'agent_error');
  }

  if (!res.body) {
    throw new AgentApiError('Empty response stream from server.', 502, 'empty_stream');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const dispatchFrame = (frame: string) => {
    const lines = frame.split(/\r?\n/);
    const dataLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }
    if (dataLines.length === 0) return;
    const rawJson = dataLines.join('\n');
    try {
      const parsed = JSON.parse(rawJson) as ChatGptStreamEvent;
      handlers.onEvent(parsed);
    } catch {
      // Ignore malformed trailing heartbeat chunk
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      dispatchFrame(frame);
      boundary = buffer.indexOf('\n\n');
    }
  }

  if (buffer.trim()) {
    dispatchFrame(buffer);
  }
}
