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

export type TutorTransportMode = 'auto' | 'interactions' | 'legacy';

/** The slice of an interaction stream event that carries answer text. */
export interface InteractionStreamEvent {
  event_type: string;
  delta?: { type?: string; text?: string } | null;
  error?: { message?: string } | null;
}

export interface TutorAiClient {
  interactions: {
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
}

/** A model id that this key/project cannot use: move to the next one. */
export function isModelMissing(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /not found|not_found|404|does not exist|unsupported model|invalid model/i.test(message);
}

/** The whole interface (not one model) is missing: the legacy path may work. */
export function isInterfaceUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /not found|not_found|404|405|501|unknown method|not implemented|unsupported api version/i.test(
    message
  );
}

/**
 * Walk the model chain for one transport. A model that answers a few tokens and
 * then fails must not be retried, or the reader would see the opening twice.
 */
async function* runChain<T>(
  models: string[],
  signal: AbortSignal,
  open: (model: string) => AsyncIterable<T>,
  log: (message: string) => void
): AsyncGenerator<T, void, unknown> {
  let lastError: unknown = null;
  for (const model of models) {
    let yielded = false;
    try {
      for await (const item of open(model)) {
        yielded = true;
        yield item;
      }
      return;
    } catch (error) {
      lastError = error;
      if (signal.aborted) return;
      if (!yielded && isModelMissing(error)) {
        log(`[ai] model ${model} unavailable, trying next`);
        continue;
      }
      throw error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('No model in the chain answered');
}

async function* streamViaInteractions(
  client: TutorAiClient,
  model: string,
  options: StreamOptions
): AsyncGenerator<string, void, unknown> {
  const stream = await client.interactions.create(
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

  if (mode !== 'legacy') {
    try {
      yield* runChain(
        options.models,
        options.signal,
        model => streamViaInteractions(client, model, options),
        log
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
    model => streamViaLegacyModels(client, model, options),
    log
  );
}
