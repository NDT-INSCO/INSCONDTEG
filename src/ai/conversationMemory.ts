/** One-month, local-device conversation memory for the INSCO copilot. */
import type { UserCopilotMessage } from './agentsContract.js';

export const COPILOT_MEMORY_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const COPILOT_MEMORY_KEY = 'insco.copilot.conversation.v1';
const MAX_STORED_MESSAGES = 300;

interface StoredConversation {
  version: 1;
  savedAt: number;
  expiresAt: number;
  messages: Array<UserCopilotMessage & { at: number }>;
}

export interface MemoryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function storageOrNull(): MemoryStorage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

export function loadCopilotConversation(
  storage: MemoryStorage | null = storageOrNull(),
  now = Date.now()
): UserCopilotMessage[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(COPILOT_MEMORY_KEY);
    if (!raw) return [];
    const saved = JSON.parse(raw) as Partial<StoredConversation>;
    if (saved.version !== 1 || !Number.isFinite(saved.expiresAt) || (saved.expiresAt as number) <= now || !Array.isArray(saved.messages)) {
      storage.removeItem(COPILOT_MEMORY_KEY);
      return [];
    }
    return saved.messages
      .slice(-MAX_STORED_MESSAGES)
      .filter((message): message is StoredConversation['messages'][number] =>
        Boolean(message && typeof message === 'object' &&
          (message.role === 'user' || message.role === 'assistant') &&
          typeof message.content === 'string' && Number.isFinite(message.at) &&
          now - message.at < COPILOT_MEMORY_TTL_MS)
      )
      .map(({ role, content }) => ({ role, content: content.slice(0, 3500) }));
  } catch {
    try { storage.removeItem(COPILOT_MEMORY_KEY); } catch { /* storage may be disabled */ }
    return [];
  }
}

export function saveCopilotConversation(
  messages: UserCopilotMessage[],
  storage: MemoryStorage | null = storageOrNull(),
  now = Date.now()
): void {
  if (!storage) return;
  const oldByMessage = new Map<string, number[]>();
  try {
    const raw = storage.getItem(COPILOT_MEMORY_KEY);
    if (raw) {
      const previous = JSON.parse(raw) as Partial<StoredConversation>;
      if (Array.isArray(previous.messages)) {
        for (const item of previous.messages) {
          if (!item || (item.role !== 'user' && item.role !== 'assistant') || typeof item.content !== 'string' || !Number.isFinite(item.at)) continue;
          const key = `${item.role}\\0${item.content}`;
          oldByMessage.set(key, [...(oldByMessage.get(key) ?? []), item.at]);
        }
      }
    }
  } catch { /* overwrite malformed prior data below */ }
  const valid = messages
    .slice(-MAX_STORED_MESSAGES)
    .filter(message => (message.role === 'user' || message.role === 'assistant') && typeof message.content === 'string')
    .map(message => {
      const content = message.content.slice(0, 3500);
      const key = `${message.role}\\0${content}`;
      const prior = oldByMessage.get(key)?.shift();
      return { role: message.role, content, at: prior ?? now };
    })
    .filter(message => now - message.at < COPILOT_MEMORY_TTL_MS);
  try {
    if (!valid.length) {
      storage.removeItem(COPILOT_MEMORY_KEY);
      return;
    }
    const record: StoredConversation = {
      version: 1,
      savedAt: now,
      expiresAt: Math.max(...valid.map(message => message.at + COPILOT_MEMORY_TTL_MS)),
      messages: valid,
    };
    storage.setItem(COPILOT_MEMORY_KEY, JSON.stringify(record));
  } catch {
    // Private browsing/quota restrictions should not break the chat UI.
  }
}

export function clearCopilotConversation(storage: MemoryStorage | null = storageOrNull()): void {
  try { storage?.removeItem(COPILOT_MEMORY_KEY); } catch { /* best effort */ }
}
