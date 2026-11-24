/**
 * LocalStorage persistence store for InscoDualAiDock Copilot chat threads.
 * Allows users to auto-save, manually snapshot, list, load, rename, and delete
 * previous conversation threads safely across sessions.
 */
import type {
  AgentAnswerKind,
  AgentCitation,
  UserCopilotAction,
  UserCopilotMode,
  UserCopilotResponse,
} from './agentsContract';

export const INSCO_COPILOT_HISTORY_KEY = 'insco_dual_ai_copilot_threads_v1';

export interface CopilotChatTurn {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  actions?: UserCopilotAction[];
  draftPost?: UserCopilotResponse['draftPost'];
  kind?: AgentAnswerKind;
  citations?: AgentCitation[];
  reasoningSteps?: string[];
}

export interface CopilotConversationThread {
  id: string;
  title: string;
  mode: UserCopilotMode;
  turns: CopilotChatTurn[];
  updatedAt: string;
}

export interface CopilotHistoryState {
  activeThreadId: string | null;
  threads: CopilotConversationThread[];
}

export function createCopilotThreadId(): string {
  return `copilot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function deriveCopilotThreadTitle(
  turns: CopilotChatTurn[],
  fallback = 'New Copilot Chat'
): string {
  const firstUser = turns.find((t) => t.role === 'user' && t.content.trim().length > 0);
  if (!firstUser) return fallback;
  const cleaned = firstUser.content.replace(/\s+/g, ' ').trim();
  return cleaned.length > 46 ? `${cleaned.slice(0, 46)}…` : cleaned;
}

const COPILOT_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

function retainCopilotTurns(turns: CopilotChatTurn[], fallbackTime?: string): CopilotChatTurn[] {
  const cutoff = Date.now() - COPILOT_RETENTION_MS;
  return turns.filter(turn => {
    const timestamp = Date.parse(turn.createdAt || fallbackTime || '');
    return Number.isFinite(timestamp) && timestamp >= cutoff;
  }).slice(-50);
}

export function loadCopilotHistoryState(): CopilotHistoryState {
  try {
    if (typeof localStorage === 'undefined') {
      return { activeThreadId: null, threads: [] };
    }
    const raw = localStorage.getItem(INSCO_COPILOT_HISTORY_KEY);
    if (!raw) return { activeThreadId: null, threads: [] };
    const parsed = JSON.parse(raw) as Partial<CopilotHistoryState>;
    const threads: CopilotConversationThread[] = Array.isArray(parsed?.threads)
      ? parsed.threads
          .filter(
            (t): t is CopilotConversationThread =>
              Boolean(
                t &&
                  typeof t.id === 'string' &&
                  typeof t.title === 'string' &&
                  Array.isArray(t.turns)
              )
          )
          .slice(0, 25)
          .map((t) => {
            const updatedAt = typeof t.updatedAt === 'string' ? t.updatedAt : '';
            return {
              id: t.id,
              title: t.title,
              mode: t.mode || 'assistant',
              turns: retainCopilotTurns(t.turns, updatedAt),
              updatedAt: updatedAt || new Date().toISOString(),
            };
          })
          .filter(thread => thread.turns.length > 0)
      : [];

    const activeThreadId =
      typeof parsed?.activeThreadId === 'string' &&
      threads.some((t) => t.id === parsed.activeThreadId)
        ? parsed.activeThreadId
        : null;

    return { activeThreadId, threads };
  } catch {
    return { activeThreadId: null, threads: [] };
  }
}

export function saveCopilotHistoryState(state: CopilotHistoryState): void {
  try {
    if (typeof localStorage === 'undefined') return;
    const sanitised: CopilotHistoryState = {
      activeThreadId: state.activeThreadId,
      threads: state.threads.slice(0, 25).map((t) => ({
        ...t,
        turns: retainCopilotTurns(t.turns, t.updatedAt),
      })).filter(thread => thread.turns.length > 0),
    };
    localStorage.setItem(INSCO_COPILOT_HISTORY_KEY, JSON.stringify(sanitised));
  } catch {
    // Ignore storage quota errors safely
  }
}

export function upsertCopilotThread(
  state: CopilotHistoryState,
  payload: {
    id: string;
    title?: string;
    mode: UserCopilotMode;
    turns: CopilotChatTurn[];
  }
): CopilotHistoryState {
  if (payload.turns.length === 0) return state;
  const existing = state.threads.find((t) => t.id === payload.id);
  const nextThread: CopilotConversationThread = {
    id: payload.id,
    title:
      (payload.title && payload.title.trim()) ||
      existing?.title ||
      deriveCopilotThreadTitle(payload.turns),
    mode: payload.mode,
    turns: retainCopilotTurns(payload.turns),
    updatedAt: new Date().toISOString(),
  };

  const nextThreads = [
    nextThread,
    ...state.threads.filter((t) => t.id !== payload.id),
  ].slice(0, 25);

  const nextState: CopilotHistoryState = {
    activeThreadId: nextThread.id,
    threads: nextThreads,
  };
  saveCopilotHistoryState(nextState);
  return nextState;
}

export function deleteCopilotThread(
  state: CopilotHistoryState,
  threadId: string
): CopilotHistoryState {
  const remaining = state.threads.filter((t) => t.id !== threadId);
  const nextActive = state.activeThreadId === threadId ? null : state.activeThreadId;
  const nextState: CopilotHistoryState = {
    activeThreadId: nextActive,
    threads: remaining,
  };
  saveCopilotHistoryState(nextState);
  return nextState;
}

export function renameCopilotThread(
  state: CopilotHistoryState,
  threadId: string,
  newTitle: string
): CopilotHistoryState {
  const clean = newTitle.trim();
  if (!clean) return state;
  const nextState: CopilotHistoryState = {
    ...state,
    threads: state.threads.map((t) =>
      t.id === threadId ? { ...t, title: clean.slice(0, 80) } : t
    ),
  };
  saveCopilotHistoryState(nextState);
  return nextState;
}
