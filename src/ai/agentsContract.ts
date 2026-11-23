/**
 * Shared contract for INSCO's two professional Gemini AI Agents:
 * 1. INSCO Site Manager & Operations Director AI (/api/ai/agent/site-manager)
 * 2. INSCO Universal User Copilot AI (/api/ai/agent/user-copilot)
 * Plus Community Post/Thread Assist (/api/ai/community/assist)
 *
 * Node & browser safe — zero DOM or Node imports.
 */

export const AGENT_MODELS = {
  /**
   * Measured on production: `gemini-3.5-flash-lite` answered in 652ms while every `flash`
   * hung and was aborted, and `gemini-4-hydrogen` returned 503 high demand every time it
   * was asked. Quota is per model, so the model with headroom leads and the busy one
   * sits at the back.
   */
  primary: 'gemini-3.5-flash-lite',
  fallback: 'gemini-3.8-flash',
  /** Walked when a model is busy or rate-limited, not only when an id is missing. */
  fallbacks: ['gemini-3.6-flash', 'gemini-4-hydrogen'] as const,
} as const;

export const AGENT_ENDPOINTS = {
  userCopilot: '/api/ai/agent/user-copilot',
  siteManager: '/api/ai/agent/site-manager',
  communityAssist: '/api/ai/community/assist',
} as const;

export type AgentLanguage = 'ar' | 'en';

/* -------------------------------------------------------------------------- */
/* 1. Universal User Copilot Agent                                            */
/* -------------------------------------------------------------------------- */

export type UserCopilotMode =
  | 'assistant'
  | 'draft_post'
  | 'improve_post'
  | 'summarize_feed'
  | 'ndt_selector'
  | 'rfq_draft'
  | 'navigate';

export interface UserCopilotContext {
  portal?: 'company' | 'client' | 'academy' | 'admin' | 'network';
  section?: string;
  companySummary?: string;
  activeTopic?: string;
  postDraftTitle?: string;
  postDraftBody?: string;
  feedPreview?: Array<{ id: string; title: string; ndtMethod: string; excerpt: string }>;
}

export interface UserCopilotMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface UserCopilotRequest {
  message: string;
  history: UserCopilotMessage[];
  language: AgentLanguage;
  mode: UserCopilotMode;
  context?: UserCopilotContext;
}

export interface UserCopilotAction {
  label: string;
  actionType: 'navigate' | 'apply_post_draft' | 'open_rfq' | 'open_ar_lab' | 'open_community';
  target?: string;
}

export interface CopilotDraftPost {
  postType: 'technical_case' | 'job_tender' | 'discussion' | 'equipment_review';
  ndtMethod: string;
  title: string;
  body: string;
  tags: string[];
}

export interface UserCopilotResponse {
  reply: string;
  suggestedActions: UserCopilotAction[];
  draftPost?: CopilotDraftPost;
  model: string;
  elapsedMs: number;
}

const VALID_COPILOT_MODES: ReadonlySet<string> = new Set([
  'assistant',
  'draft_post',
  'improve_post',
  'summarize_feed',
  'ndt_selector',
  'rfq_draft',
  'navigate',
]);

function trimStr(val: unknown, max: number): string {
  return typeof val === 'string' ? val.trim().slice(0, max) : '';
}

export function normaliseUserCopilotRequest(
  raw: unknown
): { ok: true; value: UserCopilotRequest } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = raw as Record<string, unknown>;
  const message = trimStr(obj.message, 3500);
  if (message.length < 2) {
    return { ok: false, error: 'Message must contain at least 2 characters.' };
  }

  const language: AgentLanguage = obj.language === 'en' ? 'en' : 'ar';
  const mode: UserCopilotMode =
    typeof obj.mode === 'string' && VALID_COPILOT_MODES.has(obj.mode)
      ? (obj.mode as UserCopilotMode)
      : 'assistant';

  const history: UserCopilotMessage[] = Array.isArray(obj.history)
    ? obj.history
        .slice(-10)
        .filter((item): item is { role?: unknown; content?: unknown } => Boolean(item && typeof item === 'object'))
        .map(item => ({
          role: (item.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: trimStr(item.content, 1500),
        }))
        .filter(item => item.content.length > 0)
    : [];

  let context: UserCopilotContext | undefined;
  if (obj.context && typeof obj.context === 'object') {
    const c = obj.context as Record<string, unknown>;
    const portal =
      c.portal === 'company' || c.portal === 'client' || c.portal === 'academy' || c.portal === 'admin'
        ? c.portal
        : undefined;
    context = {
      portal,
      section: trimStr(c.section, 80) || undefined,
      companySummary: trimStr(c.companySummary, 300) || undefined,
      activeTopic: trimStr(c.activeTopic, 200) || undefined,
      postDraftTitle: trimStr(c.postDraftTitle, 180) || undefined,
      postDraftBody: trimStr(c.postDraftBody, 1500) || undefined,
      feedPreview: Array.isArray(c.feedPreview)
        ? c.feedPreview
            .slice(0, 8)
            .filter((p): p is Record<string, unknown> => Boolean(p && typeof p === 'object'))
            .map(p => ({
              id: trimStr(p.id, 64),
              title: trimStr(p.title, 160),
              ndtMethod: trimStr(p.ndtMethod, 20),
              excerpt: trimStr(p.excerpt, 240),
            }))
        : undefined,
    };
  }

  return {
    ok: true,
    value: { message, history, language, mode, context },
  };
}

/* -------------------------------------------------------------------------- */
/* 2. Site Manager & Operations Director Agent                                */
/* -------------------------------------------------------------------------- */

export type SiteManagerMode =
  | 'executive_audit'
  | 'moderate_community'
  | 'triage_requests'
  | 'geofence_brief'
  | 'draft_announcement'
  | 'custom';

export interface SiteTelemetrySnapshot {
  totalRequests: number;
  newRequests: number;
  urgentRequests: number;
  totalCompanies: number;
  activeTestingCompanies: number;
  pendingAccounts: number;
  geofenceAlertCount: number;
  recentGeofenceAlerts: Array<{
    employeeName: string;
    companyCode: string;
    distanceMeters: number;
    radiusMeters: number;
    timestampIso: string;
  }>;
  communityPostsCount: number;
  communityMembersCount: number;
  opportunitiesCount: number;
  recentPosts: Array<{
    id: string;
    title: string;
    ndtMethod: string;
    postType: string;
    authorOrg: string;
    excerpt: string;
    aiModerationStatus?: string;
  }>;
  currentRoute?: string;
}

export interface SiteManagerRequest {
  instruction: string;
  language: AgentLanguage;
  mode: SiteManagerMode;
  telemetry: SiteTelemetrySnapshot;
}

export interface SiteManagerPriorityAction {
  title: string;
  detail: string;
  severity: 'high' | 'medium' | 'low';
  actionType:
    | 'navigate'
    | 'publish_announcement'
    | 'flag_post'
    | 'open_requests'
    | 'open_timeclock'
    | 'open_community';
  target?: string;
}

export interface SiteManagerResponse {
  summary: string;
  healthStatus: 'OPTIMAL' | 'ATTENTION_NEEDED' | 'ACTION_REQUIRED';
  priorityActions: SiteManagerPriorityAction[];
  flaggedPostIds: string[];
  announcementDraft?: {
    title: string;
    body: string;
    ndtMethod: string;
  };
  model: string;
  elapsedMs: number;
}

const VALID_MANAGER_MODES: ReadonlySet<string> = new Set([
  'executive_audit',
  'moderate_community',
  'triage_requests',
  'geofence_brief',
  'draft_announcement',
  'custom',
]);

function clampInt(val: unknown, max = 1_000_000): number {
  const n = typeof val === 'number' && Number.isFinite(val) ? Math.round(val) : 0;
  return Math.max(0, Math.min(max, n));
}

export function normaliseSiteManagerRequest(
  raw: unknown
): { ok: true; value: SiteManagerRequest } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = raw as Record<string, unknown>;
  const language: AgentLanguage = obj.language === 'en' ? 'en' : 'ar';
  const mode: SiteManagerMode =
    typeof obj.mode === 'string' && VALID_MANAGER_MODES.has(obj.mode)
      ? (obj.mode as SiteManagerMode)
      : 'executive_audit';

  const defaultInstr =
    language === 'ar'
      ? 'قم بإجراء مراجعة شاملة لحالة الموقع، طلبات العملاء، تنبيهات الجيوفينس، ومحتوى المجتمع.'
      : 'Perform a full operational audit across site telemetry, client requests, geofence alerts, and community posts.';
  const instruction = trimStr(obj.instruction, 2500) || defaultInstr;

  const t = (obj.telemetry && typeof obj.telemetry === 'object' ? obj.telemetry : {}) as Record<
    string,
    unknown
  >;

  const telemetry: SiteTelemetrySnapshot = {
    totalRequests: clampInt(t.totalRequests),
    newRequests: clampInt(t.newRequests),
    urgentRequests: clampInt(t.urgentRequests),
    totalCompanies: clampInt(t.totalCompanies),
    activeTestingCompanies: clampInt(t.activeTestingCompanies),
    pendingAccounts: clampInt(t.pendingAccounts),
    geofenceAlertCount: clampInt(t.geofenceAlertCount),
    recentGeofenceAlerts: Array.isArray(t.recentGeofenceAlerts)
      ? t.recentGeofenceAlerts
          .slice(0, 10)
          .filter((a): a is Record<string, unknown> => Boolean(a && typeof a === 'object'))
          .map(a => ({
            employeeName: trimStr(a.employeeName, 120),
            companyCode: trimStr(a.companyCode, 32),
            distanceMeters: clampInt(a.distanceMeters, 20_000_000),
            radiusMeters: clampInt(a.radiusMeters, 50_000),
            timestampIso: trimStr(a.timestampIso, 40),
          }))
      : [],
    communityPostsCount: clampInt(t.communityPostsCount),
    communityMembersCount: clampInt(t.communityMembersCount),
    opportunitiesCount: clampInt(t.opportunitiesCount),
    recentPosts: Array.isArray(t.recentPosts)
      ? t.recentPosts
          .slice(0, 12)
          .filter((p): p is Record<string, unknown> => Boolean(p && typeof p === 'object'))
          .map(p => ({
            id: trimStr(p.id, 64),
            title: trimStr(p.title, 180),
            ndtMethod: trimStr(p.ndtMethod, 20),
            postType: trimStr(p.postType, 32),
            authorOrg: trimStr(p.authorOrg, 140),
            excerpt: trimStr(p.excerpt, 280),
            aiModerationStatus: trimStr(p.aiModerationStatus, 24) || undefined,
          }))
      : [],
    currentRoute: trimStr(t.currentRoute, 120) || undefined,
  };

  return {
    ok: true,
    value: { instruction, language, mode, telemetry },
  };
}

/* -------------------------------------------------------------------------- */
/* 3. Community Inline Post / Thread Assist                                   */
/* -------------------------------------------------------------------------- */

export type CommunityAssistAction =
  | 'draft_from_topic'
  | 'enhance_post'
  | 'summarize_post'
  | 'suggest_reply'
  | 'code_check';

export interface CommunityAssistRequest {
  action: CommunityAssistAction;
  language: AgentLanguage;
  ndtMethod: string;
  title?: string;
  body: string;
}

export interface CommunityAssistResponse {
  reply: string;
  title?: string;
  body?: string;
  tags?: string[];
  technicalSnippet?: string;
  model: string;
  elapsedMs: number;
}

const VALID_ASSIST_ACTIONS: ReadonlySet<string> = new Set([
  'draft_from_topic',
  'enhance_post',
  'summarize_post',
  'suggest_reply',
  'code_check',
]);

export function normaliseCommunityAssistRequest(
  raw: unknown
): { ok: true; value: CommunityAssistRequest } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = raw as Record<string, unknown>;
  const action: CommunityAssistAction =
    typeof obj.action === 'string' && VALID_ASSIST_ACTIONS.has(obj.action)
      ? (obj.action as CommunityAssistAction)
      : 'enhance_post';
  const language: AgentLanguage = obj.language === 'en' ? 'en' : 'ar';
  const ndtMethod = trimStr(obj.ndtMethod, 24) || 'GENERAL';
  const title = trimStr(obj.title, 180) || undefined;
  const body = trimStr(obj.body, 3000);
  if (body.length < 3) {
    return { ok: false, error: 'Provide at least 3 characters of text or topic for AI assistance.' };
  }
  return { ok: true, value: { action, language, ndtMethod, title, body } };
}
