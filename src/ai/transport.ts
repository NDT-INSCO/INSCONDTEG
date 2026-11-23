/**
 * How the tutor talks to Gemini.
 *
 * Google's current interface is the **Interactions API**
 * (`ai.interactions.create({ stream: true })`), so that is the primary path.
 * Older keys/projects may not expose it yet, so the previous
 * `models.generateContentStream` call is kept as a fallback and can be forced
 * with `TUTOR_API_MODE=legacy`.
 *
 * The client is passed in as a narrow structural type instead of importing
 * `@google/genai` here, which keeps this module testable without network access
 * and out of the browser bundle entirely.
 */

import { classifyUpstreamError } from './contract.js';

export type TutorTransportMode = 'auto' | 'interactions' | 'legacy';

/** The slice of an interaction stream event that carries answer text. */
export interface InteractionStreamEvent {
  event_type: string;
  delta?: { type?: string; text?: string } | null;
  error?: { message?: string } | null;
}

export interface TutorAiClient {
  /**
   * Optional on purpose. `@google/genai` 2.x does not expose this surface at
   * runtime even where its types mention it, and a missing method is not a network
   * failure: it must fall through to the legacy call instead of turning every
   * question into "the model is unreachable".
   */
  interactions?: {
    create(
      params: {
        model: string;
        input: string;
        system_instruction?: string;
        generation_config?: { temperature?: number; max_output_tokens?: number };
        stream: true;
        store?: boolean;
      },
      options?: { signal?: AbortSignal }
    ): Promise<AsyncIterable<InteractionStreamEvent>>;
  };
  models: {
    generateContentStream(params: {
      model: string;
      contents: string;
      config?: {
        systemInstruction?: string;
        temperature?: number;
        maxOutputTokens?: number;
        abortSignal?: AbortSignal;
      };
    }): Promise<AsyncIterable<{ text?: string | null }>>;
  };
}

/** One model's refusal, kept so a failure can name every model that was tried. */
export interface ChainAttempt {
  model: string;
  signal: ReturnType<typeof classifyUpstreamError>;
}

export interface StreamOptions {
  prompt: string;
  system: string;
  signal: AbortSignal;
  models: string[];
  mode: TutorTransportMode;
  temperature?: number;
  maxOutputTokens?: number;
  /** Where warnings go. Injected so tests stay quiet. */
  log?: (message: string) => void;
  /** Filled in as the chain is walked: which model said what. */
  attempts?: ChainAttempt[];
  /** Override the per-model time slice (tests use a few milliseconds). */
  perModelTimeoutMs?: number;
}

/** A model id that this key/project cannot use: move to the next one. */
export function isModelMissing(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /not found|not_found|404|does not exist|unsupported model|invalid model/i.test(message);
}

/** The whole interface (not one model) is missing: the legacy path may work. */
export function isInterfaceUnavailable(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  const message = error instanceof Error ? error.message : String(error);
  return /not found|not_found|404|405|501|unknown method|not implemented|unsupported api version|not a function|cannot read propert/i.test(
    message
  );
}

/** Does this client actually expose the Interactions surface at runtime? */
export function hasInteractions(client: TutorAiClient): boolean {
  const surface = client.interactions;
  return Boolean(surface) && typeof surface?.create === 'function';
}

/**
 * Walk the model chain for one transport. A model that answers a few tokens and
 * then fails must not be retried, or the reader would see the opening twice.
 */
const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>(resolve => {
    if (signal.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => { clearTimeout(timer); resolve(); }, { once: true });
  });

/**
 * How many times the whole chain may be walked, and how long to wait between walks.
 *
 * One exhausted pass is not an answer: a model at capacity this second is often free
 * after a short pause, and the next model in the chain may answer immediately.
 */
const CHAIN_PASSES = 2;
const CHAIN_BACKOFF_MS = 1500;

/**
 * How long one model gets before the chain moves on.
 *
 * The whole chain shares a 45-second request budget; without a per-model slice a single
 * model that hangs consumes all of it and the reader gets a timeout even though three
 * other models were never asked.
 */
export const PER_MODEL_TIMEOUT_MS = 18000;

async function* runChain<T>(
  models: string[],
  signal: AbortSignal,
  open: (model: string, signal: AbortSignal) => AsyncIterable<T>,
  log: (message: string) => void,
  attempts?: ChainAttempt[],
  perModelTimeoutMs: number = PER_MODEL_TIMEOUT_MS
): AsyncGenerator<T, void, unknown> {
  let lastError: unknown = null;

  for (let pass = 1; pass <= CHAIN_PASSES; pass++) {
    /** A model refused for capacity: worth a second walk. */
    let sawBusy = false;

    for (const model of models) {
      let yielded = false;
      const budget = new AbortController();
      const onAbort = () => budget.abort();
      signal.addEventListener('abort', onAbort, { once: true });
      const timer = setTimeout(() => budget.abort(), perModelTimeoutMs);
      try {
        for await (const item of open(model, budget.signal)) {
          yielded = true;
          yield item;
        }
        return;
      } catch (error) {
        lastError = error;
        if (signal.aborted) return;
        if (budget.signal.aborted) {
          // This model alone ran out of time; the next one may still answer, but a
          // second walk of the whole chain would only spend the request budget again.
          attempts?.push({ model, signal: 'upstream_error' });
          log(`[ai] ${model} ran out of time; trying the next model`);
          continue;
        }
        // A model that emitted text and then failed is never retried: the reader would
        // see the opening twice.
        if (yielded) throw error;

        const kind = classifyUpstreamError(error);
        attempts?.push({
          model,
          signal: isModelMissing(error) && kind === 'upstream_error' ? 'model_unavailable' : kind,
        });
        if (kind === 'model_unavailable' || isModelMissing(error)) {
          log(`[ai] model ${model} unavailable, trying next`);
          continue;
        }
        if (kind === 'rate_limited' || kind === 'model_busy') {
          // Busy is about one model, not about the tutor: the next model may answer now.
          sawBusy = true;
          log(`[ai] ${model} is ${kind === 'model_busy' ? 'busy' : 'rate limited'}; trying the next model`);
          continue;
        }
        // A rejected key is never retried — it wastes the reader's time and hides the cause.
        throw error;
      } finally {
        clearTimeout(timer);
        signal.removeEventListener('abort', onAbort);
      }
    }

    if (!sawBusy || pass === CHAIN_PASSES) break;
    log('[ai] every model was busy; waiting once and walking the chain again');
    await sleep(CHAIN_BACKOFF_MS, signal);
    if (signal.aborted) return;
  }

  throw lastError instanceof Error ? lastError : new Error('No model in the chain answered');
}

async function* streamViaInteractions(
  client: TutorAiClient,
  model: string,
  options: StreamOptions
): AsyncGenerator<string, void, unknown> {
  const interactions = client.interactions;
  if (!interactions) throw new TypeError('This client has no Interactions API');
  const stream = await interactions.create(
    {
      model,
      input: options.prompt,
      system_instruction: options.system,
      generation_config: {
        temperature: options.temperature ?? 0.35,
        max_output_tokens: options.maxOutputTokens,
      },
      stream: true,
      // Student questions are not stored on Google's side.
      store: false,
    },
    { signal: options.signal }
  );

  for await (const event of stream) {
    if (event.event_type === 'step.delta') {
      const delta = event.delta;
      if (delta && delta.type === 'text' && typeof delta.text === 'string' && delta.text) {
        yield delta.text;
      }
      continue;
    }
    if (event.event_type === 'error') {
      throw new Error(event.error?.message || 'interaction stream reported an error');
    }
  }
}

async function* streamViaLegacyModels(
  client: TutorAiClient,
  model: string,
  options: StreamOptions
): AsyncGenerator<string, void, unknown> {
  const stream = await client.models.generateContentStream({
    model,
    contents: options.prompt,
    config: {
      systemInstruction: options.system,
      temperature: options.temperature ?? 0.35,
      maxOutputTokens: options.maxOutputTokens,
      abortSignal: options.signal,
    },
  });
  for await (const chunk of stream) {
    if (chunk.text) yield chunk.text;
  }
}

/**
 * Stream an answer as plain text deltas.
 *
 * `auto` tries the Interactions API first and falls back to the legacy call only
 * when the endpoint itself is unavailable — not when a model misbehaves, which
 * would otherwise hide a real failure behind a second, different request.
 */
export async function* streamTutorText(
  client: TutorAiClient,
  options: StreamOptions
): AsyncGenerator<string, void, unknown> {
  const log = options.log ?? (() => {});
  const mode: TutorTransportMode = options.mode ?? 'auto';

  if (mode !== 'legacy' && !hasInteractions(client)) {
    // The SDK in use has no Interactions surface. Saying so plainly beats failing
    // every question with "the model is unreachable".
    log('[ai] this client has no Interactions API; using generateContentStream');
  } else if (mode !== 'legacy') {
    try {
      yield* runChain(
        options.models,
        options.signal,
        (model, modelSignal) => streamViaInteractions(client, model, { ...options, signal: modelSignal }),
        log,
        options.attempts,
        options.perModelTimeoutMs
      );
      return;
    } catch (error) {
      if (options.signal.aborted) return;
      if (mode === 'interactions' || !isInterfaceUnavailable(error)) throw error;
      log(
        '[ai] Interactions API unavailable on this key, falling back to generateContentStream: ' +
          (error instanceof Error ? error.message : String(error))
      );
    }
  }

  yield* runChain(
    options.models,
    options.signal,
    (model, modelSignal) => streamViaLegacyModels(client, model, { ...options, signal: modelSignal }),
    log,
    options.attempts,
    options.perModelTimeoutMs
  );
}
