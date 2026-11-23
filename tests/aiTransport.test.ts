/**
 * The tutor's model transport.
 *
 * These tests exist because the deployment cannot reach Google from CI: the
 * shape of the request and the event parsing are the parts that would otherwise
 * only fail in production. They pin three rules:
 *
 *   1. The Interactions API (`interactions.create`) is the primary path.
 *   2. The legacy `models.generateContentStream` call is a fallback for keys
 *      that do not expose Interactions — never the first choice.
 *   3. A real failure stays a failure; it is not hidden by a second transport.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ChainAttempt,
  hasInteractions,
  InteractionStreamEvent,
  streamTutorText,
  TutorAiClient,
  TutorTransportMode,
} from '../src/ai/transport';

interface InteractionCall {
  params: Parameters<TutorAiClient['interactions']['create']>[0];
  options?: { signal?: AbortSignal };
}

interface LegacyCall {
  params: Parameters<TutorAiClient['models']['generateContentStream']>[0];
}

function fakeClient(options: {
  interactionEvents?: InteractionStreamEvent[];
  interactionError?: Error;
  /** Thrown by the first `interactions.create` only — for the rate-limit retry. */
  interactionErrorOnce?: Error;
  /** Fail this many calls with Google's 503 "high demand", then answer. */
  busyCount?: number;
  legacyChunks?: string[];
  legacyError?: Error;
  onInteraction?: () => void;
  onLegacy?: () => void;
  /** A client shaped like `@google/genai` 2.x at runtime: no Interactions surface. */
  withoutInteractions?: boolean;
}): { client: TutorAiClient; interactions: InteractionCall[]; legacy: LegacyCall[] } {
  const interactions: InteractionCall[] = [];
  const legacy: LegacyCall[] = [];

  const client: TutorAiClient = {
    interactions: {
      async create(params, requestOptions) {
        interactions.push({ params, options: requestOptions });
        options.onInteraction?.();
        if (options.interactionError) throw options.interactionError;
        if (options.busyCount && options.busyCount > 0) {
          options.busyCount -= 1;
          throw new Error(
            '503 UNAVAILABLE: This model is currently experiencing high demand. Spikes in demand are usually temporary.'
          );
        }
        if (options.interactionErrorOnce) {
          const once = options.interactionErrorOnce;
          options.interactionErrorOnce = undefined;
          throw once;
        }
        const events = options.interactionEvents ?? [];
        return (async function* () {
          for (const event of events) yield event;
        })();
      },
    },
    models: {
      async generateContentStream(params) {
        legacy.push({ params });
        options.onLegacy?.();
        if (options.legacyError) throw options.legacyError;
        const chunks = options.legacyChunks ?? [];
        return (async function* () {
          for (const text of chunks) yield { text };
        })();
      },
    },
  };

  if (options.withoutInteractions) delete (client as { interactions?: unknown }).interactions;

  return { client, interactions, legacy };
}

async function collect(stream: AsyncGenerator<string>): Promise<string[]> {
  const parts: string[] = [];
  for await (const part of stream) parts.push(part);
  return parts;
}

const base = {
  prompt: 'Explain the IIW block.',
  system: 'You are an NDT tutor.',
  signal: new AbortController().signal,
  models: ['gemini-3.8-flash', 'gemini-3.6-flash'],
  maxOutputTokens: 1600,
};

test('the Interactions API is the primary transport', async () => {
  const { client, interactions, legacy } = fakeClient({
    interactionEvents: [
      { event_type: 'interaction.created' },
      { event_type: 'step.start' },
      { event_type: 'step.delta', delta: { type: 'text', text: 'The IIW ' } },
      { event_type: 'step.delta', delta: { type: 'text', text: 'block has five steps.' } },
      { event_type: 'step.stop' },
      { event_type: 'interaction.completed' },
    ],
  });

  const parts = await collect(streamTutorText(client, { ...base, mode: 'auto' }));

  assert.deepEqual(parts, ['The IIW ', 'block has five steps.']);
  assert.equal(legacy.length, 0, 'the legacy call must not be used when Interactions works');
  assert.equal(interactions.length, 1);
});

test('the interaction request carries the prompt, system instruction and abort signal', async () => {
  const controller = new AbortController();
  const { client, interactions } = fakeClient({ interactionEvents: [] });

  await collect(streamTutorText(client, { ...base, mode: 'auto', signal: controller.signal }));

  const [{ params, options }] = interactions;
  assert.equal(params.model, 'gemini-3.8-flash');
  assert.equal(params.input, 'Explain the IIW block.');
  assert.equal(params.system_instruction, 'You are an NDT tutor.');
  assert.equal(params.stream, true);
  assert.equal(params.store, false, 'student questions must not be stored server-side');
  assert.equal(params.generation_config?.max_output_tokens, 1600);
  assert.ok(options?.signal instanceof AbortSignal, 'the model call carries its own signal');
  assert.notEqual(options.signal, controller.signal, 'each model gets a slice of the request budget');
});

test('a streamed interaction error event fails the answer instead of returning half text', async () => {
  const { client } = fakeClient({
    interactionEvents: [
      { event_type: 'step.delta', delta: { type: 'text', text: 'partial' } },
      { event_type: 'error', error: { message: 'safety blocked' } },
    ],
  });

  await assert.rejects(
    () => collect(streamTutorText(client, { ...base, mode: 'auto' })),
    /safety blocked/
  );
});

test('a project without the Interactions API falls back to generateContentStream', async () => {
  const { client, interactions, legacy } = fakeClient({
    interactionError: new Error('404 Not Found: method create is not supported'),
    legacyChunks: ['Legacy ', 'answer'],
  });

  const parts = await collect(streamTutorText(client, { ...base, mode: 'auto' }));

  assert.deepEqual(parts, ['Legacy ', 'answer']);
  assert.equal(interactions.length, 2, 'every model in the chain is tried before falling back');
  assert.equal(legacy.length, 1);
  assert.equal(legacy[0].params.model, 'gemini-3.8-flash');
});

test('mode=interactions never falls back, so a broken key is visible', async () => {
  const { client, legacy } = fakeClient({
    interactionError: new Error('404 Not Found: method create is not supported'),
    legacyChunks: ['should never be used'],
  });

  await assert.rejects(
    () => collect(streamTutorText(client, { ...base, mode: 'interactions' })),
    /404/
  );
  assert.equal(legacy.length, 0);
});

test('mode=legacy skips the Interactions API entirely', async () => {
  const { client, interactions, legacy } = fakeClient({ legacyChunks: ['old path'] });

  const parts = await collect(streamTutorText(client, { ...base, mode: 'legacy' as TutorTransportMode }));

  assert.deepEqual(parts, ['old path']);
  assert.equal(interactions.length, 0);
  assert.equal(legacy.length, 1);
});

test('a network failure is reported, not retried through the other transport', async () => {
  const { client, legacy } = fakeClient({
    interactionError: new Error('fetch failed'),
    legacyChunks: ['hidden'],
  });

  await assert.rejects(() => collect(streamTutorText(client, { ...base, mode: 'auto' })), /fetch failed/);
  assert.equal(legacy.length, 0, 'a real upstream failure must surface as an error');
});

test('an unavailable model moves to the next model in the chain', async () => {
  let call = 0;
  const client: TutorAiClient = {
    interactions: {
      async create(params) {
        call += 1;
        if (params.model === 'gemini-3.8-flash') {
          throw new Error('404 model not found');
        }
        return (async function* () {
          yield { event_type: 'step.delta', delta: { type: 'text', text: 'from the fallback model' } };
        })();
      },
    },
    models: {
      async generateContentStream() {
        throw new Error('legacy must not be called');
      },
    },
  };

  const parts = await collect(streamTutorText(client, { ...base, mode: 'auto' }));
  assert.deepEqual(parts, ['from the fallback model']);
  assert.equal(call, 2);
});

test('a failure after text was streamed is not retried, so the answer is not duplicated', async () => {
  const client: TutorAiClient = {
    interactions: {
      async create(params) {
        if (params.model !== 'gemini-3.8-flash') throw new Error('should not be reached');
        return (async function* () {
          yield { event_type: 'step.delta', delta: { type: 'text', text: 'The answer starts' } };
          throw new Error('connection reset by peer');
        })();
      },
    },
    models: {
      async generateContentStream() {
        throw new Error('legacy must not be called');
      },
    },
  };

  const parts: string[] = [];
  await assert.rejects(async () => {
    for await (const text of streamTutorText(client, { ...base, mode: 'auto' })) parts.push(text);
  }, /connection reset/);
  assert.deepEqual(parts, ['The answer starts']);
});

test('an aborted request stops quietly instead of reporting an upstream error', async () => {
  const controller = new AbortController();
  const client: TutorAiClient = {
    interactions: {
      async create() {
        return (async function* () {
          yield { event_type: 'step.delta', delta: { type: 'text', text: 'before the abort' } };
          controller.abort();
          throw new Error('The operation was aborted');
        })();
      },
    },
    models: {
      async generateContentStream() {
        throw new Error('legacy must not be called');
      },
    },
  };

  const parts = await collect(streamTutorText(client, { ...base, mode: 'auto', signal: controller.signal }));
  assert.deepEqual(parts, ['before the abort']);
});

test('a busy model hands the question to the next model in the chain', async () => {
  const logs: string[] = [];
  const { client, interactions } = fakeClient({
    interactionErrorOnce: new Error(
      '503 UNAVAILABLE: This model is currently experiencing high demand. Spikes in demand are usually temporary.'
    ),
    interactionEvents: [{ event_type: 'step.delta', delta: { type: 'text', text: 'The IIW block.' } }],
  });

  const parts = await collect(
    streamTutorText(client, { ...base, mode: 'interactions', log: message => logs.push(message) })
  );

  assert.deepEqual(parts, ['The IIW block.']);
  assert.equal(interactions.length, 2, 'a busy model must not end the answer');
  assert.equal(interactions[0].params.model, 'gemini-3.8-flash');
  assert.equal(interactions[1].params.model, 'gemini-3.6-flash', 'the fallback answers instead');
  assert.match(logs.join('\n'), /gemini-3\.8-flash is busy; trying the next model/);
});

test('when every model is busy the chain waits once, then tries again', async () => {
  const logs: string[] = [];
  const { client, interactions } = fakeClient({
    busyCount: 2,
    interactionEvents: [{ event_type: 'step.delta', delta: { type: 'text', text: 'Answered on the second pass.' } }],
  });

  const parts = await collect(
    streamTutorText(client, { ...base, mode: 'interactions', log: message => logs.push(message) })
  );

  assert.deepEqual(parts, ['Answered on the second pass.']);
  assert.equal(interactions.length, 3, 'two models on the first pass, then one answer');
  assert.match(logs.join('\n'), /every model was busy; waiting once/);
});

test('a rejected key is never retried and never hidden', async () => {
  const { client, interactions, legacy } = fakeClient({
    interactionError: new Error('400 API key not valid. Please pass a valid API key.'),
  });

  await assert.rejects(
    () => collect(streamTutorText(client, { ...base, mode: 'interactions' })),
    /API key not valid/
  );
  assert.equal(interactions.length, 1, 'retrying a bad key only wastes the student\'s time');
  assert.equal(legacy.length, 0);
});

test('a client with no Interactions surface goes straight to the legacy call', async () => {
  const logs: string[] = [];
  const { client, interactions, legacy } = fakeClient({
    withoutInteractions: true,
    legacyChunks: ['The IIW block has five steps.'],
  });

  const parts = await collect(
    streamTutorText(client, { ...base, mode: 'auto', log: message => logs.push(message) })
  );

  assert.deepEqual(parts, ['The IIW block has five steps.']);
  assert.equal(interactions.length, 0);
  assert.equal(legacy.length, 1, 'the legacy call is the only path a 2.x client has');
  assert.match(logs.join('\n'), /no Interactions API/);
});

test('hasInteractions tells the two client shapes apart', () => {
  assert.equal(hasInteractions(fakeClient({}).client), true);
  assert.equal(hasInteractions(fakeClient({ withoutInteractions: true }).client), false);
});

test('the chain records which model said what', async () => {
  const attempts: ChainAttempt[] = [];
  const { client } = fakeClient({
    busyCount: 2,
    interactionEvents: [{ event_type: 'step.delta', delta: { type: 'text', text: 'ok' } }],
  });

  await collect(streamTutorText(client, { ...base, mode: 'interactions', attempts }));

  assert.deepEqual(
    attempts.map(a => [a.model, a.signal]),
    [
      ['gemini-3.8-flash', 'model_busy'],
      ['gemini-3.6-flash', 'model_busy'],
    ]
  );
});

test('one slow model does not consume the whole request budget', async () => {
  const logs: string[] = [];
  const attempts: ChainAttempt[] = [];
  // A client whose first model never answers, and whose second answers at once.
  let call = 0;
  const client: TutorAiClient = {
    models: {
      async generateContentStream(params) {
        call += 1;
        const signal = params.config?.abortSignal;
        if (call === 1) {
          return (async function* () {
            // Like the SDK: the stream stays open until its signal aborts it.
            await new Promise((_, reject) => {
              signal?.addEventListener('abort', () => reject(new Error('This operation was aborted')), {
                once: true,
              });
            });
            yield { text: 'never reached' };
          })();
        }
        return (async function* () {
          yield { text: 'Answered by the second model.' };
        })();
      },
    },
  };

  const parts = await collect(
    streamTutorText(client, {
      ...base,
      mode: 'legacy',
      log: message => logs.push(message),
      attempts,
      perModelTimeoutMs: 80,
    })
  );

  assert.deepEqual(parts, ['Answered by the second model.']);
  assert.match(logs.join('\n'), /ran out of time; trying the next model/);
  assert.doesNotMatch(logs.join('\n'), /every model was busy/, 'a timeout is not a reason to walk the chain again');
  assert.deepEqual(attempts[0], { model: 'gemini-3.8-flash', signal: 'upstream_error' });
});

test('a model that has started answering is allowed to finish', async () => {
  // The per-model slice is a first-token deadline. Cutting a model off mid-answer is how
  // production produced half an answer followed by "the service is busy".
  let calls = 0;
  let release: (() => void) | null = null;
  const client: TutorAiClient = {
    models: {
      async generateContentStream() {
        calls += 1;
        return (async function* () {
          yield { text: 'The answer begins' };
          await new Promise<void>(resolve => { release = resolve; });
          yield { text: ' and finishes.' };
        })();
      },
    },
  };

  const parts: string[] = [];
  const run = (async () => {
    for await (const text of streamTutorText(client, { ...base, mode: 'legacy', perModelTimeoutMs: 40 })) {
      parts.push(text);
    }
  })();

  await new Promise(resolve => setTimeout(resolve, 150));
  assert.equal(calls, 1, 'the next model is never asked for a second answer');
  release!();
  await run;
  assert.deepEqual(parts, ['The answer begins', ' and finishes.']);
});

test('aborting the request aborts the model call in flight', async () => {
  const controller = new AbortController();
  const logs: string[] = [];
  let sawAbort = false;
  const client: TutorAiClient = {
    models: {
      async generateContentStream(params) {
        return (async function* () {
          await new Promise((_, reject) => {
            params.config?.abortSignal?.addEventListener(
              'abort',
              () => {
                sawAbort = true;
                reject(new Error('This operation was aborted'));
              },
              { once: true }
            );
          });
          yield { text: 'never reached' };
        })();
      },
    },
  };

  const stream = streamTutorText(client, {
    ...base,
    mode: 'legacy',
    signal: controller.signal,
    log: message => logs.push(message),
  });
  const collected = collect(stream);
  setTimeout(() => controller.abort(), 30);
  await collected;

  assert.equal(sawAbort, true, 'the model call saw the abort');
  assert.doesNotMatch(logs.join('\n'), /ran out of time/, 'a cancelled request is not a timeout');
});
