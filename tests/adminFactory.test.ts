import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  DEFAULT_FACTORY_NEURON, FACTORY_LIMITS, factoryBundle, factorySnapshot,
  normaliseFactoryDraft, normaliseFactoryRequest, scoreFactoryNeuron, simulateFactory, type FactoryRequest,
} from '../src/admin/factory';
import { FACTORY_LANGUAGES, localFactoryDraft, starterCells } from '../src/admin/factoryTemplates';
import { createFactoryDrafter } from '../server/admin/factory';

const request: FactoryRequest = {
  task: 'inbox', output: 'bot', trigger: 'daily', locale: 'en', language: 'TypeScript', brief: 'Draft an internal follow-up report.',
  cells: ['input', 'rule', 'draft'], includeSnapshot: false,
};

test('factory inputs only accept bounded, inert step kinds and strip client-supplied site context', () => {
  assert.deepEqual(normaliseFactoryRequest({ ...request, telemetry: { private: true }, commands: ['sample'] }), request);
  for (const override of [
    { cells: ['shell'] }, { cells: [] }, { cells: Array(FACTORY_LIMITS.cells + 1).fill('input') },
    { output: 'execute' }, { trigger: 'url' }, { includeSnapshot: 'yes' },
    { language: 'JavaScript\nextra' }, { brief: 'a'.repeat(FACTORY_LIMITS.brief + 1) },
  ]) assert.equal(normaliseFactoryRequest({ ...request, ...override }), null);
  assert.equal(normaliseFactoryRequest({ ...request, brief: '' }), null);
  assert.ok(normaliseFactoryRequest({ ...request, brief: '', language: 'Elixir' }, false));
  assert.equal(createFactoryDrafter({ MANUS_API_KEY: 'unused-test-fixture' }), null);
});

test('factory draft parsing bounds the output and accepts text without treating it as an action', () => {
  const valid = { title: 'Draft', summary: 'Read-only result', steps: [{ kind: 'draft', label: 'Prepare output' }], code: '<b>literal text</b>', checks: ['Review manually'] };
  assert.deepEqual(normaliseFactoryDraft({ ...valid, execution: 'enabled' }), valid);
  assert.equal(normaliseFactoryDraft({ ...valid, code: '    pass\n' })?.code, '    pass\n');
  for (const override of [{ code: 'x'.repeat(FACTORY_LIMITS.code + 1) }, { checks: [] }, { steps: [{ kind: 'review', label: 'Bypass' }] }, { title: '' }]) {
    assert.equal(normaliseFactoryDraft({ ...valid, ...override }), null);
  }
});

test('aggregate snapshot omits private announcement content', () => {
  const dashboard = { updatedAt: '2026-11-18T09:00:00.000Z', totals: { new: 5, overdue: 2, in_progress: 7, total: 12, closed: 0 },
    announcement: { enabled: true, updatedAt: null, message: { ar: 'نص خاص', en: 'private draft copy' } } };
  assert.deepEqual(factorySnapshot(dashboard), { capturedAt: '2026-11-18T09:00:00.000Z', newRequests: 5, overdue: 2, inProgress: 7, announcementEnabled: true });
});

test('an untrained neuron scores a fixed synthetic example and the rehearsal always ends in review', () => {
  const base = starterCells('custom');
  const quiet = simulateFactory(base, 'custom', 'quiet');
  const busy = simulateFactory(base, 'custom', 'busy');
  assert.deepEqual(quiet.map(item => item.state), ['read', 'clear', 'drafted', 'review']);
  assert.deepEqual(busy.map(item => item.state), ['read', 'flagged', 'drafted', 'review']);
  assert.ok(busy[1].score! > quiet[1].score!);
  const noSignal = simulateFactory(base.slice(1), 'inbox', 'busy');
  assert.deepEqual(noSignal.map(item => item.state), ['no_input', 'no_input', 'review']);
  assert.ok(Number.isFinite(scoreFactoryNeuron(DEFAULT_FACTORY_NEURON, NaN, Infinity).score));
  assert.equal(scoreFactoryNeuron({ ...DEFAULT_FACTORY_NEURON, delayWeight: -3 }, .7, .6).recommendReview, false);
});

test('offline language packs give real snippets, while unsupported combinations are honest', () => {
  const cells = starterCells('inbox');
  assert.ok(FACTORY_LANGUAGES.length >= 12);
  for (const language of FACTORY_LANGUAGES) assert.ok(localFactoryDraft({ ...request, language }, cells).code, language);
  assert.match(localFactoryDraft({ ...request, output: 'neuron', language: 'Python' }, cells).code!, /def neuron/);
  assert.equal(localFactoryDraft({ ...request, output: 'neuron', language: 'Go' }, cells).code, null);
  assert.equal(localFactoryDraft({ ...request, language: 'Elixir' }, cells).code, null);
  assert.equal(localFactoryDraft({ ...request, output: 'scenario' }, cells).code, null);
});

test('bot export is a linked draft bundle with a locked terminal review and no live data', () => {
  const cells = starterCells('inbox');
  const bundle = factoryBundle({ ...request, includeSnapshot: true }, cells, localFactoryDraft(request, cells), 'template');
  assert.equal(bundle.execution, 'disabled');
  assert.equal(bundle.requiresHumanReview, true);
  assert.equal(bundle.workflow.at(-1)?.kind, 'review');
  assert.deepEqual(bundle.workflow.at(-1)?.dependsOn, [cells.at(-1)?.id]);
  assert.deepEqual(bundle.bot, { input: 'inbox', trigger: 'daily', mode: 'manual-review-only' });
  assert.equal('includeSnapshot' in bundle.brief, false);
  assert.equal('snapshot' in bundle, false);
});

test('the Gemini adapter sends only design context and uses text-only, non-stored interactions', async t => {
  const proposed = { title: 'Internal review', summary: 'Read synthetic counts.', steps: [], code: null, checks: ['Try empty counts'] };
  const requests: Record<string, unknown>[] = [];
  t.mock.method(globalThis, 'fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const req = new Request(input, init);
    assert.equal(req.method, 'POST');
    assert.match(new URL(req.url).pathname, /\/interactions$/);
    assert.equal(req.headers.get('x-goog-api-key'), 'test-key-not-a-secret');
    const body = await req.json() as Record<string, unknown>;
    requests.push(body);
    const text = requests.length === 1 ? '```json\n' + JSON.stringify(proposed) + '\n```' : 'Not a draft';
    const delta = { event_type: 'step.delta', delta: { type: 'text', text } };
    return new Response(`data: ${JSON.stringify(delta)}\n\ndata: [DONE]\n\n`, { headers: { 'Content-Type': 'text/event-stream' } });
  });
  const draft = createFactoryDrafter({ API_KEY: 'test-key-not-a-secret', FACTORY_AI_MODEL: 'test-model' });
  assert.ok(draft);
  assert.deepEqual(await draft(request, null, new AbortController().signal), proposed);
  assert.equal(requests[0].model, 'test-model');
  assert.equal(requests[0].store, false);
  assert.equal(requests[0].stream, true);
  assert.equal(requests[0].tools, undefined);
  assert.equal(requests[0].background, undefined);
  assert.deepEqual(JSON.parse(String(requests[0].input)), {
    brief: request.brief, task: request.task, output: request.output, trigger: request.trigger,
    language: request.language, locale: request.locale, scenarioKinds: request.cells,
  });
  const snapshot = { capturedAt: '2026-11-18T13:00:00.000Z', newRequests: 2, overdue: 1, inProgress: 0, announcementEnabled: false };
  assert.equal(await draft({ ...request, includeSnapshot: true }, snapshot, new AbortController().signal), null);
  assert.deepEqual(JSON.parse(String(requests[1].input)).snapshot, snapshot);
});
