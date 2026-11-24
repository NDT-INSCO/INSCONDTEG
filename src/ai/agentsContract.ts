/**
 * Shared, provider-neutral contracts for INSCO's user copilot, operations
 * manager and community editor. Their answer path is deterministic, retrieval
 * and site-data based, and does not need an external model key.
 *
 * Node & browser safe — zero DOM or Node imports.
 */

export const AGENT_MODELS = {
  primary: 'gemini-3.5-flash-lite',
  fallback: 'gemini-3.8-flash',
  fallbacks: ['gemini-3.6-flash', 'gemini-4-hydrogen'] as const,
} as const;

export const AGENT_ENDPOINTS = {
  userCopilot: '/api/ai/agent/user-copilot',
  siteManager: '/api/ai/agent/site-manager',
  communityAssist: '/api/ai/community/assist',
  chatgptStream: '/api/ai/agent/chatgpt-stream',
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

export interface AgentCitation {
  id: string;
  title: string;
  section?: string;
  page?: number;
  sourceType?: 'site-library' | 'private-drive';
  url?: string;
}

export type AgentAnswerKind = 'library' | 'rules' | 'editorial' | 'site-data' | 'decline';

export interface UserCopilotResponse {
  reply: string;
  suggestedActions: UserCopilotAction[];
  draftPost?: CopilotDraftPost;
  /** null means no external model/API key was used. */
  model: string | null;
  kind?: AgentAnswerKind;
  citations?: AgentCitation[];
  reasoningSteps?: string[];
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
  model: string | null;
  kind?: AgentAnswerKind;
  reasoningSteps?: string[];
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
  model: string | null;
  kind?: AgentAnswerKind;
  citations?: AgentCitation[];
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

/* -------------------------------------------------------------------------- */
/* 4. ChatGPT-Class Autonomous Streaming Agent (INSCO AI Agent)               */
/* -------------------------------------------------------------------------- */

export type ChatGptTaskMode =
  | 'auto'
  | 'thinking'
  | 'web_search'
  | 'deep_research'
  | 'canvas'
  | 'code_analyst'
  | 'vision_ndt';

export type ChatGptThinkingEffort = 'low' | 'medium' | 'high';

export type ChatGptResponseStyle = 'balanced' | 'concise' | 'detailed' | 'step_by_step';

export type ChatGptReasoningArchitecture =
  | 'auto'
  | 'first_principles'
  | 'chain_of_verification'
  | 'tree_of_thoughts'
  | 'react_planner'
  | 'socratic_tutor';

export type ChatGptTrainingPack =
  | 'ndt_codes'
  | 'film_diagnostics'
  | 'pwht_thermal'
  | 'software_architecture'
  | 'executive_reports';

export interface ChatGptFewShotExample {
  id: string;
  inputPattern: string;
  expectedStructure: string;
}

export interface ChatGptMemoryProfile {
  customInstructions: string;
  responseStyle: ChatGptResponseStyle;
  savedMemories: string[];
  activeTrainingPacks?: ChatGptTrainingPack[];
  defaultArchitecture?: ChatGptReasoningArchitecture;
  selfVerifyDefault?: boolean;
  fewShotExamples?: ChatGptFewShotExample[];
}

export interface ChatGptAttachment {
  id: string;
  name: string;
  mimeType: string;
  kind: 'image' | 'pdf' | 'text';
  sizeBytes: number;
  dataBase64?: string;
  textContent?: string;
}

export interface ChatGptHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatGptGroundingSource {
  title: string;
  uri: string;
}

export interface ChatGptCanvasArtifact {
  id: string;
  title: string;
  kind: 'markdown' | 'code' | 'table' | 'html' | 'svg' | 'report';
  language?: string;
  content: string;
}

export interface ChatGptPlatformAction {
  label: string;
  actionType:
    | 'navigate'
    | 'apply_post_draft'
    | 'open_rfq'
    | 'open_ar_lab'
    | 'open_community'
    | 'open_workshop';
  target?: string;
  draftPost?: CopilotDraftPost;
}

export interface ChatGptStreamRequest {
  message: string;
  history: ChatGptHistoryMessage[];
  language: AgentLanguage;
  mode: ChatGptTaskMode;
  thinkingEffort: ChatGptThinkingEffort;
  reasoningArchitecture?: ChatGptReasoningArchitecture;
  trainingPacks?: ChatGptTrainingPack[];
  selfVerifyPass?: boolean;
  verifyTargetTurn?: {
    question: string;
    draftAnswer: string;
  };
  webSearchEnabled: boolean;
  attachments: ChatGptAttachment[];
  memoryProfile?: ChatGptMemoryProfile;
  canvasDocument?: {
    title: string;
    kind: string;
    content: string;
  };
  context?: UserCopilotContext;
}

export type ChatGptStreamEvent =
  | { type: 'status'; phase: string; label: string }
  | { type: 'thought'; delta: string }
  | { type: 'token'; delta: string }
  | { type: 'sources'; sources: ChatGptGroundingSource[] }
  | { type: 'tool_action'; action: ChatGptPlatformAction }
  | { type: 'artifact'; artifact: ChatGptCanvasArtifact }
  | { type: 'memory_saved'; memory: string }
  | {
      type: 'done';
      model: string;
      elapsedMs: number;
      architectureUsed?: ChatGptReasoningArchitecture;
      libraryHitsCount?: number;
    }
  | { type: 'error'; code: string; message: string };

const VALID_CHATGPT_MODES: ReadonlySet<string> = new Set([
  'auto',
  'thinking',
  'web_search',
  'deep_research',
  'canvas',
  'code_analyst',
  'vision_ndt',
]);

const VALID_THINKING_EFFORTS: ReadonlySet<string> = new Set(['low', 'medium', 'high']);

const VALID_RESPONSE_STYLES: ReadonlySet<string> = new Set([
  'balanced',
  'concise',
  'detailed',
  'step_by_step',
]);

const VALID_ARCHITECTURES: ReadonlySet<string> = new Set([
  'auto',
  'first_principles',
  'chain_of_verification',
  'tree_of_thoughts',
  'react_planner',
  'socratic_tutor',
]);

const VALID_TRAINING_PACKS: ReadonlySet<string> = new Set([
  'ndt_codes',
  'film_diagnostics',
  'pwht_thermal',
  'software_architecture',
  'executive_reports',
]);

const ALLOWED_IMAGE_MIMES: ReadonlySet<string> = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

const ALLOWED_TEXT_MIMES: ReadonlySet<string> = new Set([
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
  'text/html',
]);

export function normaliseSafeExternalUrl(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function normaliseChatGptStreamRequest(
  raw: unknown
): { ok: true; value: ChatGptStreamRequest } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = raw as Record<string, unknown>;
  const message = trimStr(obj.message, 12_000);
  const rawAttachments = Array.isArray(obj.attachments) ? obj.attachments.slice(0, 4) : [];

  if (message.length < 1 && rawAttachments.length === 0 && !obj.verifyTargetTurn) {
    return { ok: false, error: 'Provide a message or attach at least one file.' };
  }

  const language: AgentLanguage = obj.language === 'en' ? 'en' : 'ar';
  const mode: ChatGptTaskMode =
    typeof obj.mode === 'string' && VALID_CHATGPT_MODES.has(obj.mode)
      ? (obj.mode as ChatGptTaskMode)
      : 'auto';

  const thinkingEffort: ChatGptThinkingEffort =
    typeof obj.thinkingEffort === 'string' && VALID_THINKING_EFFORTS.has(obj.thinkingEffort)
      ? (obj.thinkingEffort as ChatGptThinkingEffort)
      : mode === 'thinking' || mode === 'deep_research'
      ? 'high'
      : mode === 'code_analyst' || mode === 'canvas'
      ? 'medium'
      : 'low';

  const reasoningArchitecture: ChatGptReasoningArchitecture =
    typeof obj.reasoningArchitecture === 'string' &&
    VALID_ARCHITECTURES.has(obj.reasoningArchitecture)
      ? (obj.reasoningArchitecture as ChatGptReasoningArchitecture)
      : 'auto';

  const trainingPacks: ChatGptTrainingPack[] = Array.isArray(obj.trainingPacks)
    ? Array.from(
        new Set(
          obj.trainingPacks.filter(
            (p): p is ChatGptTrainingPack =>
              typeof p === 'string' && VALID_TRAINING_PACKS.has(p)
          )
        )
      )
    : ['ndt_codes', 'film_diagnostics', 'pwht_thermal', 'software_architecture'];

  const selfVerifyPass =
    typeof obj.selfVerifyPass === 'boolean' ? obj.selfVerifyPass : true;

  let verifyTargetTurn: ChatGptStreamRequest['verifyTargetTurn'];
  if (obj.verifyTargetTurn && typeof obj.verifyTargetTurn === 'object') {
    const vt = obj.verifyTargetTurn as Record<string, unknown>;
    const q = trimStr(vt.question, 4000);
    const d = trimStr(vt.draftAnswer, 12_000);
    if (d.length >= 4) {
      verifyTargetTurn = {
        question: q || message,
        draftAnswer: d,
      };
    }
  }

  const webSearchEnabled =
    typeof obj.webSearchEnabled === 'boolean'
      ? obj.webSearchEnabled
      : mode === 'web_search' || mode === 'deep_research';

  const history: ChatGptHistoryMessage[] = Array.isArray(obj.history)
    ? obj.history
        .slice(-24)
        .filter((item): item is { role?: unknown; content?: unknown } =>
          Boolean(item && typeof item === 'object')
        )
        .map(item => ({
          role: (item.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
          content: trimStr(item.content, 4000),
        }))
        .filter(item => item.content.length > 0)
    : [];

  const attachments: ChatGptAttachment[] = [];
  for (const item of rawAttachments) {
    if (!item || typeof item !== 'object') continue;
    const rec = item as Record<string, unknown>;
    const mimeType = trimStr(rec.mimeType, 80).toLowerCase();
    const name = trimStr(rec.name, 140) || 'attachment';
    const id = trimStr(rec.id, 64) || `att-${attachments.length + 1}`;
    const sizeBytes = clampInt(rec.sizeBytes, 3_500_000);

    if (ALLOWED_IMAGE_MIMES.has(mimeType) || mimeType === 'application/pdf') {
      const dataBase64 = typeof rec.dataBase64 === 'string' ? rec.dataBase64.trim() : '';
      if (dataBase64.length > 3_500_000) {
        return { ok: false, error: `Attachment ${name} exceeds 3.5MB payload cap.` };
      }
      if (dataBase64.length > 0) {
        attachments.push({
          id,
          name,
          mimeType,
          kind: mimeType === 'application/pdf' ? 'pdf' : 'image',
          sizeBytes,
          dataBase64,
        });
      }
    } else if (ALLOWED_TEXT_MIMES.has(mimeType) || mimeType.startsWith('text/')) {
      const textContent = trimStr(rec.textContent, 30_000);
      if (textContent.length > 0) {
        attachments.push({
          id,
          name,
          mimeType: mimeType || 'text/plain',
          kind: 'text',
          sizeBytes,
          textContent,
        });
      }
    } else if (mimeType) {
      return { ok: false, error: `Unsupported attachment MIME type: ${mimeType}` };
    }
  }

  let memoryProfile: ChatGptMemoryProfile | undefined;
  if (obj.memoryProfile && typeof obj.memoryProfile === 'object') {
    const mp = obj.memoryProfile as Record<string, unknown>;
    const style: ChatGptResponseStyle =
      typeof mp.responseStyle === 'string' && VALID_RESPONSE_STYLES.has(mp.responseStyle)
        ? (mp.responseStyle as ChatGptResponseStyle)
        : 'balanced';
    const profilePacks = Array.isArray(mp.activeTrainingPacks)
      ? mp.activeTrainingPacks.filter(
          (p): p is ChatGptTrainingPack =>
            typeof p === 'string' && VALID_TRAINING_PACKS.has(p)
        )
      : undefined;
    const fewShots: ChatGptFewShotExample[] = Array.isArray(mp.fewShotExamples)
      ? mp.fewShotExamples
          .slice(0, 12)
          .filter((ex): ex is Record<string, unknown> => Boolean(ex && typeof ex === 'object'))
          .map((ex, idx) => ({
            id: trimStr(ex.id, 64) || `fs-${idx + 1}`,
            inputPattern: trimStr(ex.inputPattern, 400),
            expectedStructure: trimStr(ex.expectedStructure, 1200),
          }))
          .filter(ex => ex.inputPattern.length > 0 && ex.expectedStructure.length > 0)
      : [];

    memoryProfile = {
      customInstructions: trimStr(mp.customInstructions, 2000),
      responseStyle: style,
      savedMemories: Array.isArray(mp.savedMemories)
        ? mp.savedMemories
            .slice(0, 20)
            .map(m => trimStr(m, 240))
            .filter(Boolean)
        : [],
      ...(profilePacks ? { activeTrainingPacks: profilePacks } : {}),
      ...(typeof mp.defaultArchitecture === 'string' &&
      VALID_ARCHITECTURES.has(mp.defaultArchitecture)
        ? { defaultArchitecture: mp.defaultArchitecture as ChatGptReasoningArchitecture }
        : {}),
      ...(typeof mp.selfVerifyDefault === 'boolean'
        ? { selfVerifyDefault: mp.selfVerifyDefault }
        : {}),
      ...(fewShots.length > 0 ? { fewShotExamples: fewShots } : {}),
    };
  }

  let canvasDocument: ChatGptStreamRequest['canvasDocument'];
  if (obj.canvasDocument && typeof obj.canvasDocument === 'object') {
    const cd = obj.canvasDocument as Record<string, unknown>;
    const content = trimStr(cd.content, 24_000);
    if (content) {
      canvasDocument = {
        title: trimStr(cd.title, 160) || 'Canvas Document',
        kind: trimStr(cd.kind, 24) || 'markdown',
        content,
      };
    }
  }

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
      activeTopic: trimStr(c.activeTopic, 200) || undefined,
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
    value: {
      message:
        message ||
        (verifyTargetTurn
          ? language === 'ar'
            ? 'دقّق هذا الرد وتحقق من صحته المنطقية والهندسية.'
            : 'Verify and critique this response for logic, math, and standards compliance.'
          : language === 'ar'
          ? 'حلل الملفات المرفقة بالتفصيل.'
          : 'Analyze the attached files in detail.'),
      history,
      language,
      mode,
      thinkingEffort,
      reasoningArchitecture,
      trainingPacks,
      selfVerifyPass,
      verifyTargetTurn,
      webSearchEnabled,
      attachments,
      memoryProfile,
      canvasDocument,
      context,
    },
  };
}
