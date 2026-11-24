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
  return `${gatewayBase()}${path}`;
}

export class AgentApiError extends Error {
  readonly status: number;
  readonly code: string;
  /**
   * Set when the second engine (Manus) picked the request up but is still working: the
   * task keeps running after this response, so the reader gets a link that outlives it.
   */
  readonly manusTaskUrl?: string;

  constructor(message: string, status: number, code = 'agent_error', manusTaskUrl?: string) {
    super(message);
    this.name = 'AgentApiError';
    this.status = status;
    this.code = code;
    this.manusTaskUrl = manusTaskUrl;
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
    error?: { code?: string; message?: string; manus?: { taskId?: string; taskUrl?: string } };
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
    throw new AgentApiError(msg, res.status, code, data?.error?.manus?.taskUrl);
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
  const res = await fetch(AGENT_ENDPOINTS.chatgptStream, {
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

