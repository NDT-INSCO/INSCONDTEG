import type {
  ChatGptCanvasArtifact,
  ChatGptFewShotExample,
  ChatGptGroundingSource,
  ChatGptMemoryProfile,
  ChatGptPlatformAction,
  ChatGptReasoningArchitecture,
  ChatGptTaskMode,
  ChatGptThinkingEffort,
  ChatGptTrainingPack,
} from './agentsContract';

export const INSCO_CHATGPT_THREADS_KEY = 'insco_chatgpt_threads_v1';
export const INSCO_CHATGPT_MEMORY_KEY = 'insco_chatgpt_memory_v1';
const CHATGPT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export const DEFAULT_TRAINING_PACKS: ChatGptTrainingPack[] = [
  'ndt_codes',
  'film_diagnostics',
  'pwht_thermal',
  'software_architecture',
];

export interface ChatGptMessageAttachmentMeta {
  id: string;
  name: string;
  mimeType: string;
  kind: 'image' | 'pdf' | 'text';
  sizeBytes: number;
}

export interface ChatGptTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thought?: string;
  sources?: ChatGptGroundingSource[];
  actions?: ChatGptPlatformAction[];
  artifacts?: ChatGptCanvasArtifact[];
  attachments?: ChatGptMessageAttachmentMeta[];
  model?: string;
  elapsedMs?: number;
  architectureUsed?: ChatGptReasoningArchitecture;
  libraryHitsCount?: number;
  feedback?: 'up' | 'down' | null;
  createdAt: string;
}

export interface ChatGptThread {
  id: string;
  title: string;
  mode: ChatGptTaskMode;
  thinkingEffort: ChatGptThinkingEffort;
  reasoningArchitecture: ChatGptReasoningArchitecture;
  selfVerifyPass: boolean;
  webSearchEnabled: boolean;
  pinned: boolean;
  turns: ChatGptTurn[];
  activeCanvas: ChatGptCanvasArtifact | null;
  updatedAt: string;
}

export function createEmptyThread(isAr: boolean): ChatGptThread {
  return {
    id: `thread-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: isAr ? 'محادثة جديدة' : 'New Chat',
    mode: 'auto',
    thinkingEffort: 'medium',
    reasoningArchitecture: 'auto',
    selfVerifyPass: true,
    webSearchEnabled: false,
    pinned: false,
    turns: [],
    activeCanvas: null,
    updatedAt: new Date().toISOString(),
  };
}

export function deriveThreadTitle(text: string, fallback: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return fallback;
  return cleaned.length > 42 ? `${cleaned.slice(0, 42)}…` : cleaned;
}

export function loadChatGptThreads(isAr: boolean): ChatGptThread[] {
  try {
    if (typeof localStorage === 'undefined') return [createEmptyThread(isAr)];
    const raw = localStorage.getItem(INSCO_CHATGPT_THREADS_KEY);
    if (!raw) return [createEmptyThread(isAr)];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [createEmptyThread(isAr)];
    }
    const cutoff = Date.now() - CHATGPT_RETENTION_MS;
    const retained = (parsed.slice(0, 30) as Partial<ChatGptThread>[]).map((t) => {
      const turns = Array.isArray(t.turns) ? t.turns.filter(turn => {
        const created = Date.parse(turn.createdAt || t.updatedAt || '');
        return Number.isFinite(created) && created >= cutoff;
      }) : [];
      return {
        ...createEmptyThread(isAr),
        ...t,
        reasoningArchitecture: t.reasoningArchitecture ?? 'auto',
        selfVerifyPass: typeof t.selfVerifyPass === 'boolean' ? t.selfVerifyPass : true,
        turns,
      };
    }).filter(thread => thread.turns.length > 0 || Date.parse(thread.updatedAt) >= cutoff);
    return retained.length ? retained : [createEmptyThread(isAr)];
  } catch {
    return [createEmptyThread(isAr)];
  }
}

export function saveChatGptThreads(threads: ChatGptThread[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const cutoff = Date.now() - CHATGPT_RETENTION_MS;
    const trimmed = threads.slice(0, 30).map((t) => ({
      ...t,
      turns: t.turns.filter(turn => Date.parse(turn.createdAt) >= cutoff).slice(-40).map((turn) => ({
        ...turn,
        // Strip heavy raw base64 payloads while preserving attachment metadata
        attachments: turn.attachments?.map((att) => ({
          id: att.id,
          name: att.name,
          mimeType: att.mimeType,
          kind: att.kind,
          sizeBytes: att.sizeBytes,
        })),
      })),
    })).filter(thread => thread.turns.length > 0 || Date.parse(thread.updatedAt) >= cutoff);
    localStorage.setItem(INSCO_CHATGPT_THREADS_KEY, JSON.stringify(trimmed));
  } catch {
    // Ignore storage quota limits
  }
}

function defaultMemoryProfile(): ChatGptMemoryProfile {
  return {
    customInstructions: '',
    responseStyle: 'balanced',
    savedMemories: [],
    activeTrainingPacks: [...DEFAULT_TRAINING_PACKS],
    defaultArchitecture: 'auto',
    selfVerifyDefault: true,
    fewShotExamples: [],
  };
}

export function loadMemoryProfile(): ChatGptMemoryProfile {
  try {
    if (typeof localStorage === 'undefined') {
      return defaultMemoryProfile();
    }
    const raw = localStorage.getItem(INSCO_CHATGPT_MEMORY_KEY);
    if (!raw) {
      return defaultMemoryProfile();
    }
    const parsed = JSON.parse(raw) as Partial<ChatGptMemoryProfile>;
    const fewShotExamples: ChatGptFewShotExample[] = Array.isArray(parsed.fewShotExamples)
      ? parsed.fewShotExamples
          .filter(
            (ex): ex is ChatGptFewShotExample =>
              Boolean(
                ex &&
                  typeof ex.inputPattern === 'string' &&
                  typeof ex.expectedStructure === 'string'
              )
          )
          .slice(0, 12)
      : [];

    return {
      customInstructions:
        typeof parsed.customInstructions === 'string' ? parsed.customInstructions : '',
      responseStyle:
        parsed.responseStyle === 'concise' ||
        parsed.responseStyle === 'detailed' ||
        parsed.responseStyle === 'step_by_step'
          ? parsed.responseStyle
          : 'balanced',
      savedMemories: Array.isArray(parsed.savedMemories)
        ? parsed.savedMemories.filter((m): m is string => typeof m === 'string').slice(0, 20)
        : [],
      activeTrainingPacks: Array.isArray(parsed.activeTrainingPacks)
        ? parsed.activeTrainingPacks
        : [...DEFAULT_TRAINING_PACKS],
      defaultArchitecture: parsed.defaultArchitecture ?? 'auto',
      selfVerifyDefault:
        typeof parsed.selfVerifyDefault === 'boolean' ? parsed.selfVerifyDefault : true,
      fewShotExamples,
    };
  } catch {
    return defaultMemoryProfile();
  }
}

export function saveMemoryProfile(profile: ChatGptMemoryProfile): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(INSCO_CHATGPT_MEMORY_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage limits
  }
}
