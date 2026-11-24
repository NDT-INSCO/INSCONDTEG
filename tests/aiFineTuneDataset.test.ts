import assert from 'node:assert/strict';
import test from 'node:test';
import { KNOWLEDGE_LESSONS } from '../src/data/academyKnowledge.js';
import { buildFineTuneDataset, toChatMessagesJsonl, toVertexJsonl, type FineTuneRecord } from '../src/ai/fineTuneDataset.js';

test('fine-tuning export is bilingual, source-checked, and held out by whole lesson', () => {
  const first = buildFineTuneDataset();
  const second = buildFineTuneDataset();
  assert.deepEqual(first, second, 'split and example order must be deterministic');
  assert.ok(first.train.length >= 100);
  assert.ok(first.validation.length >= 16);
  assert.equal(first.skipped.length, 0);

  const trainLessons = new Set(first.train.map(record => record.lessonId));
  const validationLessons = new Set(first.validation.map(record => record.lessonId));
  assert.equal([...trainLessons].some(id => validationLessons.has(id)), false, 'no translation or task from one lesson may leak across the split');
  assert.equal(trainLessons.size + validationLessons.size, KNOWLEDGE_LESSONS.length);

  for (const record of [...first.train, ...first.validation]) {
    assert.ok(record.sources.length > 0);
    assert.ok(['ar', 'en'].includes(record.language));
    assert.ok(['quiz', 'principle', 'application', 'limitations'].includes(record.task));
    const [user, model] = record.example.contents;
    assert.equal(user.role, 'user');
    assert.equal(model.role, 'model');
    assert.match(user.parts[0].text, /Educational reference notes:|ملاحظات مرجعية تعليمية:/);
    assert.ok(model.parts[0].text.trim().length > 10);
    assert.match(record.example.systemInstruction.parts[0].text, /Never invent sources|لا تختلق مصادر/);
  }

  const quiz = [...first.train, ...first.validation].find(record => record.task === 'quiz')!;
  assert.doesNotMatch(quiz.example.contents[0].parts[0].text, /Answer key:|مفتاح الإجابة:/, 'quiz key must not be present in the prompt');
});

test('Vertex JSONL is one valid GenerateContent example per line', () => {
  const sample: FineTuneRecord = buildFineTuneDataset().train[0];
  const encoded = toVertexJsonl([sample]);
  const lines = encoded.trimEnd().split('\n');
  assert.equal(lines.length, 1);
  const decoded = JSON.parse(lines[0]);
  assert.ok(Array.isArray(decoded.contents));
  assert.equal(decoded.contents.length, 2);
  assert.equal(decoded.contents[0].role, 'user');
  assert.equal(decoded.contents[1].role, 'model');
  assert.ok(decoded.systemInstruction.parts[0].text.length > 0);

  const chatLines = toChatMessagesJsonl([sample]).trimEnd().split('\n');
  assert.equal(chatLines.length, 1);
  const chatExample = JSON.parse(chatLines[0]);
  assert.deepEqual(chatExample.messages.map((message: { role: string }) => message.role), ['system', 'user', 'assistant']);
  assert.ok(chatExample.messages.every((message: { content: string }) => message.content.length > 0));
});
