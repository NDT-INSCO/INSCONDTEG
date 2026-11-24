import React from 'react';
import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://ndt-insco.github.io/-Project-/#ask_ai', pretendToBeVisual: true });
Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  MouseEvent: dom.window.MouseEvent,
  KeyboardEvent: dom.window.KeyboardEvent,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  IS_REACT_ACT_ENVIRONMENT: true,
});

// A static deployment has no /api/ai/* at all: fetch fails on the network layer.
const failingFetch = async (): Promise<Response> => {
  throw new TypeError('Failed to fetch');
};
Object.assign(globalThis, { fetch: failingFetch });
const FAILING_FETCH = globalThis.fetch;

const { EducationalAcademy } = await import('../src/components/EducationalAcademy');
const { VirtualEngineer } = await import('../src/components/academy/VirtualEngineer');
const { SemanticSearchBar } = await import('../src/components/academy/SemanticSearchBar');
const { render, cleanup, fireEvent, waitFor } = await import('@testing-library/react');

const OLD_CANNED_TEXT = 'في تقنيات الفحص غير الإتلافي والمعالجة الحرارية، يتم تطبيق مواصفات ASME';


test('the virtual engineer uses the honest tutor gateway status instead of canned answers', async () => {
  const ui = render(<VirtualEngineer language="ar" route="learn" onOpenHash={() => undefined} />);
  const launcher = [...ui.container.querySelectorAll('button')].find(button =>
    /المهندس الافتراضي/.test(button.textContent || '')
  );
  assert.ok(launcher, 'the virtual engineer launcher must be visible');
  fireEvent.click(launcher!);

  const topic = [...ui.container.querySelectorAll('button')].find(button =>
    /اشرح مبدأ UT/.test(button.textContent || '')
  );
  assert.ok(topic, 'a UT starter question must be available');
  fireEvent.click(topic!);

  await waitFor(() => {
    assert.match(ui.container.textContent || '', /المستشار الذكي غير مُهيّأ|تعذّر الوصول إلى النموذج/);
  });

  assert.doesNotMatch(ui.container.textContent || '', /في فحص UT نرسل نبضة/);
  cleanup();
});

/* ---------------------------------------------------------------- */
/* learner-controlled explanation pacing                             */
/* ---------------------------------------------------------------- */

const TUTOR_ONLINE = {
  configured: true,
  reason: 'no_key',
  model: 'gemini-3.5-flash-lite',
  deepModel: 'gemini-4-argon',
  limits: { messageChars: 4000, messages: 20, outputTokens: 1600, passages: 5, contextChars: 9000, minScore: 4.2 },
  retrieval: { documents: 132, ready: true, source: 'academy' },
  transport: 'auto',
};

const sseAnswer = (text: string) => [
  `data: ${JSON.stringify({ type: 'delta', text })}`,
  `data: ${JSON.stringify({ type: 'done' })}`,
].join('\n\n') + '\n\n';

const buttonWith = (root: HTMLElement, label: RegExp) =>
  [...root.querySelectorAll('button')].find(button => label.test(button.textContent || ''));

test('the simulator handoff follows the original lesson after a continuation', async () => {
  const requests: { messages: { role: string; content: string }[] }[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.includes('/api/ai/status')) {
      return new Response(JSON.stringify(TUTOR_ONLINE), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes('/api/ai/tutor')) {
      requests.push(JSON.parse(String(init?.body ?? '{}')));
      return new Response(sseAnswer('PAUT explanation'), { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
    }
    return new Response('{}', { status: 404 });
  }) as typeof fetch;

  const opened: string[] = [];
  const ui = render(
    <VirtualEngineer language="en" route="practice" onOpenHash={hash => opened.push(hash)} />
  );
  try {
    const launcher = buttonWith(ui.container, /Virtual Engineer/);
    assert.ok(launcher, 'the virtual engineer launcher must be visible');
    fireEvent.click(launcher!);

    const input = ui.container.querySelector('input') as HTMLInputElement;
    assert.ok(input, 'the question input must exist');
    fireEvent.change(input, { target: { value: 'Explain PAUT principles' } });
    const send = ui.container.querySelector('button[aria-label="Send"]') as HTMLButtonElement;
    assert.ok(send, 'the send button must exist');
    fireEvent.click(send);

    await waitFor(() => {
      assert.match(ui.container.textContent || '', /PAUT explanation/);
    });
    const simulator = buttonWith(ui.container, /Show me the simulator/);
    assert.ok(simulator, 'the learner must be offered a simulator handoff');
    fireEvent.click(simulator!);
    assert.deepEqual(opened, ['#paut_controller'], 'the PAUT simulator opens for a PAUT lesson');

    const next = buttonWith(ui.container, /^Continue$/);
    assert.ok(next, 'the learner must be offered a continuation');
    fireEvent.click(next!);
    await waitFor(() => assert.equal(requests.length, 2));
    const history = requests[1].messages;
    assert.match(history[history.length - 1].content, /Continue from where you stopped/);
    assert.ok(
      history.some(message => /Explain PAUT principles/.test(message.content)),
      'the original lesson topic stays in the conversation'
    );

    await waitFor(() => {
      assert.match(ui.container.textContent || '', /PAUT explanation/);
    });
    fireEvent.click(buttonWith(ui.container, /Show me the simulator/)!);
    assert.deepEqual(opened, ['#paut_controller', '#paut_controller'], 'continuation must not change the simulator');
  } finally {
    cleanup();
    globalThis.fetch = FAILING_FETCH;
  }
});

test('stopping a stream keeps the partial answer and ignores chunks that arrive later', async () => {
  const encoder = new TextEncoder();
  const requests: { messages: { role: string; content: string }[] }[] = [];
  let sendLateChunk: (() => void) | null = null;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url.includes('/api/ai/status')) {
      return new Response(JSON.stringify(TUTOR_ONLINE), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    if (url.includes('/api/ai/tutor')) {
      if (init?.body) requests.push(JSON.parse(String(init.body)));
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: 'First part' })}\n\n`));
          sendLateChunk = () => {
            try {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: ' later part' })}\n\n`));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
              controller.close();
            } catch {
              // The reader was cancelled after the learner stopped the stream.
            }
          };
        },
      });
      return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
    }
    return new Response('{}', { status: 404 });
  }) as typeof fetch;

  const ui = render(<VirtualEngineer language="en" route="learn" onOpenHash={() => undefined} />);
  try {
    fireEvent.click(buttonWith(ui.container, /Virtual Engineer/)!);
    const input = ui.container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Explain UT principles' } });
    fireEvent.click(ui.container.querySelector('button[aria-label="Send"]') as HTMLButtonElement);

    await waitFor(() => {
      assert.match(ui.container.textContent || '', /First part/);
    });
    const stop = buttonWith(ui.container, /Stop explanation/);
    assert.ok(stop, 'a streaming answer must offer an immediate stop control');
    fireEvent.click(stop!);

    assert.match(ui.container.textContent || '', /The explanation ends here/);
    assert.equal(ui.container.querySelector('[role="alert"]'), null, 'stopping is not a gateway failure');
    sendLateChunk?.();
    await new Promise(resolve => setTimeout(resolve, 30));
    assert.doesNotMatch(ui.container.textContent || '', /later part/, 'late chunks cannot edit a stopped answer');

    fireEvent.click(buttonWith(ui.container, /^Continue$/)!);
    await waitFor(() => assert.equal(requests.length, 2));
    assert.ok(
      requests[1].messages.some(message => message.role === 'assistant' && /First part/.test(message.content)),
      'the partial explanation is kept in the session for the continuation'
    );
  } finally {
    cleanup();
    globalThis.fetch = FAILING_FETCH;
  }
});

/* ---------------------------------------------------------------- */
/* tutor tab                                                         */
/* ---------------------------------------------------------------- */

test('without a gateway the tutor tab says so and prints no answer', async () => {
  const ui = render(<EducationalAcademy language="ar" initialSubTab="ask_ai" />);

  await waitFor(() => {
    assert.match(ui.container.textContent || '', /غير مُهيّأ/);
  });

  const text = ui.container.textContent || '';
  assert.doesNotMatch(text, new RegExp(OLD_CANNED_TEXT), 'the canned paragraph must never be shown as an answer');
  assert.match(text, /ابحث في المكتبة بدلاً من ذلك/, 'learners get a working library alternative');
  assert.equal(ui.container.querySelector('input[placeholder*="الاستفسار"]'), null, 'the form is hidden when nothing can answer');
  cleanup();
});

test('the same tab in English explains the same limitation', async () => {
  const ui = render(<EducationalAcademy language="en" initialSubTab="ask_ai" />);
  await waitFor(() => {
    assert.match(ui.container.textContent || '', /not configured/i);
  });
  assert.match(ui.container.textContent || '', /Search the library instead/);
  cleanup();
});

/* ---------------------------------------------------------------- */
/* library search                                                    */
/* ---------------------------------------------------------------- */

test('search returns real library hits and opens the exact page', async () => {
  const opened: { tab: string; bookId?: string; pageNumber?: number }[] = [];
  const ui = render(
    <SemanticSearchBar language="ar" onOpenTarget={target => opened.push(target)} />
  );

  const input = ui.container.querySelector('input[type="search"]') as HTMLInputElement;
  assert.ok(input, 'the search input must exist');

  fireEvent.change(input, { target: { value: 'Jaeger' } });

  await waitFor(() => {
    assert.ok(ui.container.querySelectorAll('[role="option"]').length > 0, 'no results rendered');
  });

  const options = ui.container.querySelectorAll('[role="option"]');
  assert.ok(options.length >= 1);
  assert.match(options[0].textContent || '', /متطلبات الإضاءة/);

  fireEvent.click(options[0].querySelector('button') as HTMLButtonElement);
  assert.equal(opened.length, 1);
  assert.equal(opened[0].tab, 'edb');
  assert.equal(opened[0].bookId, 'book-vt');
  assert.equal(opened[0].pageNumber, 1);
  cleanup();
});

test('a course lesson hit opens the course, not a book page', async () => {
  const opened: { tab: string; courseId?: string }[] = [];
  const ui = render(<SemanticSearchBar language="ar" onOpenTarget={target => opened.push(target)} />);
  const input = ui.container.querySelector('input[type="search"]') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'الإضاءة' } });

  await waitFor(() => {
    assert.ok(ui.container.querySelectorAll('[role="option"]').length > 0);
  });

  const first = ui.container.querySelectorAll('[role="option"]')[0];
  fireEvent.click(first.querySelector('button') as HTMLButtonElement);
  assert.equal(opened[0].tab, 'courses');
  assert.ok(opened[0].courseId);
  cleanup();
});

test('an English query works in the English UI', async () => {
  const ui = render(<SemanticSearchBar language="en" />);
  const input = ui.container.querySelector('input[type="search"]') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'illumination' } });
  await waitFor(() => {
    assert.ok(ui.container.querySelectorAll('[role="option"]').length > 0);
  });
  assert.match(ui.container.textContent || '', /Illumination/i);
  cleanup();
});

test('a query with no match says so instead of showing unrelated pages', async () => {
  const ui = render(<SemanticSearchBar language="ar" />);
  const input = ui.container.querySelector('input[type="search"]') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'مطعم كشري' } });
  await waitFor(() => {
    assert.match(ui.container.textContent || '', /لا تطابق مؤكد/);
  });
  assert.equal(ui.container.querySelectorAll('[role="option"]').length, 0);
  cleanup();
});

test('the search offers to hand the question to the tutor', async () => {
  const asked: string[] = [];
  const ui = render(<SemanticSearchBar language="ar" onAskTutor={question => asked.push(question)} />);
  const input = ui.container.querySelector('input[type="search"]') as HTMLInputElement;
  fireEvent.change(input, { target: { value: 'PWHT' } });

  await waitFor(() => {
    assert.match(ui.container.textContent || '', /اسأل المستشار/);
  });

  const button = [...ui.container.querySelectorAll('button')].find(item => /اسأل المستشار/.test(item.textContent || ''));
  assert.ok(button);
  fireEvent.click(button!);
  assert.deepEqual(asked, ['PWHT']);
  cleanup();
});
