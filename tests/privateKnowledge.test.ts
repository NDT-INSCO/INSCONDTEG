import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { resetPrivateKnowledgeForTests, searchPrivateKnowledge } from '../server/ai/privateKnowledge.js';

const original = process.env.INSCO_PRIVATE_KNOWLEDGE_SERVICE_ACCOUNT;

afterEach(() => {
  if (original === undefined) delete process.env.INSCO_PRIVATE_KNOWLEDGE_SERVICE_ACCOUNT;
  else process.env.INSCO_PRIVATE_KNOWLEDGE_SERVICE_ACCOUNT = original;
  resetPrivateKnowledgeForTests();
});

test('private Drive excerpts fail closed without an owner-configured server identity', async () => {
  delete process.env.INSCO_PRIVATE_KNOWLEDGE_SERVICE_ACCOUNT;
  resetPrivateKnowledgeForTests();
  assert.deepEqual(await searchPrivateKnowledge('ASME B31.3 piping', 'a'.repeat(40)), []);
});

test('private Drive excerpts are never looked up without a signed-in caller token', async () => {
  process.env.INSCO_PRIVATE_KNOWLEDGE_SERVICE_ACCOUNT = '{bad json';
  resetPrivateKnowledgeForTests();
  assert.deepEqual(await searchPrivateKnowledge('ASME B31.3 piping'), []);
});
