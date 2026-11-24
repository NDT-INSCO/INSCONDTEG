import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  clearCopilotConversation,
  COPILOT_MEMORY_KEY,
  COPILOT_MEMORY_TTL_MS,
  loadCopilotConversation,
  saveCopilotConversation,
  type MemoryStorage,
} from '../src/ai/conversationMemory.js';

class Memory implements MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}

test('copilot history is retained and resumes across reloads within 30 days', () => {
  const storage = new Memory();
  const now = Date.UTC(2026, 10, 22);
  saveCopilotConversation([{ role: 'user', content: 'ما الفرق بين PAUT و TOFD؟' }, { role: 'assistant', content: 'إجابة مقتبسة' }], storage, now);
  assert.deepEqual(loadCopilotConversation(storage, now + 10 * 24 * 60 * 60 * 1000), [
    { role: 'user', content: 'ما الفرق بين PAUT و TOFD؟' },
    { role: 'assistant', content: 'إجابة مقتبسة' },
  ]);
});

test('each message expires after one month even if a later exchange is saved', () => {
  const storage = new Memory();
  const start = 1_000_000;
  const old = [{ role: 'user' as const, content: 'old topic' }];
  saveCopilotConversation(old, storage, start);
  const later = start + 20 * 24 * 60 * 60 * 1000;
  saveCopilotConversation([...old, { role: 'assistant' as const, content: 'new reply' }], storage, later);
  assert.deepEqual(loadCopilotConversation(storage, start + COPILOT_MEMORY_TTL_MS + 1), [
    { role: 'assistant', content: 'new reply' },
  ]);
});

test('corrupt or expired memory is cleared and users can erase it immediately', () => {
  const storage = new Memory();
  storage.setItem(COPILOT_MEMORY_KEY, '{bad json');
  assert.deepEqual(loadCopilotConversation(storage, 100), []);
  assert.equal(storage.getItem(COPILOT_MEMORY_KEY), null);
  saveCopilotConversation([{ role: 'user', content: 'private' }], storage, 100);
  clearCopilotConversation(storage);
  assert.equal(storage.getItem(COPILOT_MEMORY_KEY), null);
});
