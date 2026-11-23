/**
 * Comprehensive verification suite for the ChatGPT-class INSCO AI Agent:
 * - Contract normalizers & URL / upload security validators
 * - Cognitive Architecture Router, Domain Playbooks, Few-Shot Rules, & RAG Engine
 * - Persistent multi-thread store & memory/training profile
 * - Real-time SSE streaming (status, thoughts, tokens, citations, Canvas artifacts, actions, memory_saved, errors)
 * - Stop generation via AbortController & 1-click CoVe Logic Verification Audit
 */
import React from 'react';
import { afterEach, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html lang="en" dir="ltr"><body></body></html>', {
  url: 'https://ndt-insco.github.io/INSCONDTEG/',
  pretendToBeVisual: true,
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  sessionStorage: dom.window.sessionStorage,
  HTMLElement: dom.window.HTMLElement,
  SVGElement: dom.window.SVGElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  URL: dom.window.URL,
  Blob: dom.window.Blob,
  IS_REACT_ACT_ENVIRONMENT: true,
});

dom.window.scrollTo = () => {};
dom.window.HTMLElement.prototype.scrollIntoView = () => {};

const agentsContract = await import('../src/ai/agentsContract');
const chatgptStore = await import('../src/ai/chatgptStore');
const cognitive = await import('../server/ai/cognitiveArchitecture');
const { InscoDualAiDock } = await import('../src/components/ai/InscoDualAiDock');
const { MarkdownCanvasRenderer } = await import('../src/components/ai/MarkdownCanvasRenderer');
const { render, fireEvent, cleanup, waitFor } = await import('@testing-library/react');

const originalFetch = globalThis.fetch;

function createSseResponse(events: Array<{ data: unknown }>, delayMs = 0): Response {
  const encoder = new TextEncoder();
  const chunks = events.map((ev) => {
    const type = (ev.data as { type?: string }).type || 'message';
    return `event: ${type}\ndata: ${JSON.stringify(ev.data)}\n\n`;
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const chunk of chunks) {
        if (delayMs > 0) {
          await new Promise((r) => setTimeout(r, delayMs));
        }
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8' },
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

/* ---------------- 1. Contract & Security Validators ---------------- */

test('normaliseChatGptStreamRequest validates bounds, MIME types, architectures, training packs, and URLs', () => {
  const emptyReq = agentsContract.normaliseChatGptStreamRequest({ message: '   ' });
  assert.equal(emptyReq.ok, false);

  const invalidMime = agentsContract.normaliseChatGptStreamRequest({
    message: 'Analyze binary',
    attachments: [
      {
        id: 'a1',
        name: 'payload.exe',
        mimeType: 'application/x-msdownload',
        kind: 'text',
        sizeBytes: 120,
        textContent: 'bin',
      },
    ],
  });
  assert.equal(invalidMime.ok, false);

  const validReq = agentsContract.normaliseChatGptStreamRequest({
    message: 'Explain ASME Sec. V Art. 2 IQI rules and write a Python exposure calculator',
    language: 'en',
    mode: 'thinking',
    thinkingEffort: 'high',
    reasoningArchitecture: 'first_principles',
    trainingPacks: ['ndt_codes', 'software_architecture'],
    selfVerifyPass: true,
    webSearchEnabled: true,
    history: [{ role: 'user', content: 'Previous NDT question' }],
    attachments: [
      {
        id: 'att-csv',
        name: 'welds.csv',
        mimeType: 'text/csv',
        kind: 'text',
        textContent: 'weld,thickness\nW1,18mm',
        sizeBytes: 25,
      },
    ],
    memoryProfile: {
      customInstructions: 'Always cite ASME clauses.',
      responseStyle: 'detailed',
      savedMemories: ['Working on P91 header welds'],
      fewShotExamples: [
        {
          id: 'fs-1',
          inputPattern: 'RT Film reading',
          expectedStructure: '1. Quality check 2. Defect type 3. Code verdict',
        },
      ],
    },
  });

  assert.equal(validReq.ok, true);
  if (validReq.ok) {
    assert.equal(validReq.value.mode, 'thinking');
    assert.equal(validReq.value.thinkingEffort, 'high');
    assert.equal(validReq.value.reasoningArchitecture, 'first_principles');
    assert.deepEqual(validReq.value.trainingPacks, ['ndt_codes', 'software_architecture']);
    assert.equal(validReq.value.selfVerifyPass, true);
    assert.equal(validReq.value.webSearchEnabled, true);
    assert.equal(validReq.value.attachments?.length, 1);
    assert.equal(validReq.value.memoryProfile?.savedMemories[0], 'Working on P91 header welds');
    assert.equal(validReq.value.memoryProfile?.fewShotExamples?.[0].inputPattern, 'RT Film reading');
  }

  assert.equal(
    agentsContract.normaliseSafeExternalUrl('https://www.asme.org/codes-standards'),
    'https://www.asme.org/codes-standards'
  );
  assert.equal(agentsContract.normaliseSafeExternalUrl('javascript:alert(1)'), null);
  assert.equal(agentsContract.normaliseSafeExternalUrl('data:text/html,<script>1</script>'), null);
});

/* ---------------- 2. Cognitive Architecture, Training & Response Logic Engine ---------------- */

test('cognitiveArchitecture selects adaptive reasoning strategies, builds playbooks, and formats RAG context', () => {
  assert.equal(
    cognitive.selectAdaptiveArchitecture('Compare PAUT vs TOFD for 28mm piping', 'auto', 'auto', false),
    'tree_of_thoughts'
  );
  assert.equal(
    cognitive.selectAdaptiveArchitecture('Calculate geometric unsharpness Ug = (F*d)/D', 'auto', 'auto', false),
    'first_principles'
  );
  assert.equal(
    cognitive.selectAdaptiveArchitecture('Verify and audit this PWHT chart', 'auto', 'auto', false),
    'chain_of_verification'
  );
  assert.equal(
    cognitive.selectAdaptiveArchitecture('Build a TypeScript parser for DICONDE tags', 'auto', 'code_analyst', false),
    'react_planner'
  );
  assert.equal(
    cognitive.selectAdaptiveArchitecture('Teach me UT from scratch with a quiz', 'auto', 'auto', false),
    'socratic_tutor'
  );
  assert.equal(
    cognitive.selectAdaptiveArchitecture('Any prompt', 'auto', 'auto', true),
    'chain_of_verification'
  );

  const blueprint = cognitive.buildArchitectureBlueprint('chain_of_verification', 'en', true);
  assert.ok(blueprint.includes('Chain-of-Verification (CoVe)'));
  assert.ok(blueprint.includes('SELF-AUDIT LOGIC GATE'));

  const logicContract = cognitive.buildResponseLogicContract('ar', 'step_by_step');
  assert.ok(logicContract.includes('التسلسل المرقّم'));

  const knowledge = cognitive.buildTrainedKnowledgeContext({
    packs: ['ndt_codes', 'pwht_thermal'],
    customFewShots: [
      {
        id: 'fs-custom',
        inputPattern: 'Calculate Ug',
        expectedStructure: 'Equation -> Assumptions -> Result -> ASME Sec V Limit',
      },
    ],
    libraryHits: [],
    lang: 'en',
  });
  assert.ok(knowledge.includes('PLAYBOOK: NDT Codes & Quantitative Equations'));
  assert.ok(knowledge.includes('PLAYBOOK: PWHT 65kW Induction'));
  assert.ok(knowledge.includes('USER-TRAINED FEW-SHOT RULES'));
  assert.ok(knowledge.includes('Equation -> Assumptions -> Result -> ASME Sec V Limit'));
});

/* ---------------- 3. Persistent Store Sanitization ---------------- */

test('chatgptStore persists threads, architecture, training packs, and strips heavy attachment bytes', () => {
  const thread = chatgptStore.createEmptyThread(false);
  thread.reasoningArchitecture = 'tree_of_thoughts';
  thread.turns.push({
    id: 'turn-1',
    role: 'user',
    content: 'Inspect weld radiograph',
    createdAt: new Date().toISOString(),
    attachments: [
      {
        id: 'img-1',
        name: 'film.png',
        mimeType: 'image/png',
        kind: 'image',
        sizeBytes: 12000,
      },
    ],
  });

  chatgptStore.saveChatGptThreads([thread]);
  const reloaded = chatgptStore.loadChatGptThreads(false);
  assert.equal(reloaded.length, 1);
  assert.equal(reloaded[0].reasoningArchitecture, 'tree_of_thoughts');
  assert.equal(reloaded[0].turns[0].attachments?.[0].name, 'film.png');
  assert.equal((reloaded[0].turns[0].attachments?.[0] as { dataBase64?: string }).dataBase64, undefined);
});

/* ---------------- 4. Safe Markdown & Canvas Renderer ---------------- */

test('MarkdownCanvasRenderer safely renders headings, tables, code blocks, and strips unsafe links', () => {
  let openedCanvasTitle = '';
  const { container, getByText } = render(
    <MarkdownCanvasRenderer
      isAr={false}
      content={[
        '## RT Calibration Table',
        '',
        '| Thickness | IQI Wire |',
        '| --- | --- |',
        '| 12 mm | 10 FE |',
        '',
        'Check [ASME Portal](https://www.asme.org) and ignore [Evil](javascript:alert(1)).',
        '',
        '```python',
        'print("ug_mm = 0.25")',
        '```',
      ].join('\n')}
      onOpenInCanvas={(art) => {
        openedCanvasTitle = art.title;
      }}
    />
  );

  assert.ok(getByText('RT Calibration Table'));
  assert.ok(getByText('10 FE'));
  const anchors = Array.from(container.querySelectorAll('a'));
  assert.equal(anchors.length, 1);
  assert.equal(anchors[0].getAttribute('href'), 'https://www.asme.org/');
  assert.ok(container.textContent?.includes('Evil'));
  assert.equal(container.querySelector('script'), null);

  fireEvent.click(getByText('Open Canvas'));
  assert.ok(openedCanvasTitle.toLowerCase().includes('python'));
});

/* ---------------- 5. Full ChatGPT Studio + Training + Architecture + CoVe Audit ---------------- */

test('InscoDualAiDock supports reasoning architecture selection, custom training rules, SSE streaming, Canvas, and 1-click CoVe audit', async () => {
  const visited: string[] = [];
  const postedBodies: Array<Record<string, unknown>> = [];

  globalThis.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body || '{}')) as Record<string, unknown>;
    postedBodies.push(body);

    if (body['verifyTargetTurn']) {
      return createSseResponse([
        { data: { type: 'status', phase: 'reasoning', label: 'Running CoVe Verification...' } },
        { data: { type: 'token', delta: '### CoVe Audit Passed\n\nAll equations & ASME Table T-276 limits verified.' } },
        {
          data: {
            type: 'done',
            model: 'gemini-4-hydrogen',
            elapsedMs: 420,
            architectureUsed: 'chain_of_verification',
            libraryHitsCount: 2,
          },
        },
      ]);
    }

    return createSseResponse([
      { data: { type: 'status', phase: 'searching', label: 'Applying [First-Principles] · 3 INSCO refs...' } },
      { data: { type: 'thought', delta: 'Checking ASME Sec V Art 2 Table T-276 wire selection rules.' } },
      {
        data: {
          type: 'token',
          delta: '### Inspection Summary\n\nUse **10 FE** wire IQI on 16 mm weld.\n\n',
        },
      },
      {
        data: {
          type: 'token',
          delta: '```ts\nexport const ug = (s * d) / (sod - d);\n```',
        },
      },
      {
        data: {
          type: 'sources',
          sources: [{ title: 'ASME BPVC Sec V', uri: 'https://www.asme.org/sec-v' }],
        },
      },
      {
        data: {
          type: 'artifact',
          artifact: {
            id: 'art-rt-1',
            title: 'RT Technique Sheet W-101',
            kind: 'markdown',
            content: '# Technique Sheet\nSource: Ir-192\nIQI: 10 FE',
          },
        },
      },
      {
        data: {
          type: 'tool_action',
          action: {
            label: 'Open Practical Workshop',
            actionType: 'open_workshop',
            target: 'sim_labs_rt',
          },
        },
      },
      {
        data: {
          type: 'memory_saved',
          memory: 'Preferred code is ASME Sec V Art 2',
        },
      },
      {
        data: {
          type: 'done',
          model: 'gemini-4-hydrogen',
          elapsedMs: 640,
          architectureUsed: 'first_principles',
          libraryHitsCount: 3,
        },
      },
    ]);
  }) as typeof fetch;

  const { getByTestId, getByText, getAllByText, queryByTestId } = render(
    <InscoDualAiDock
      language="en"
      portal="company"
      section="overview"
      onOpenCompany={(s) => visited.push(`company:${s ?? 'home'}`)}
      onOpenClient={(s) => visited.push(`client:${s ?? 'home'}`)}
      onOpenAcademy={(t) => visited.push(`academy:${t ?? 'home'}`)}
    />
  );

  // Backward-compatible launcher opens Copilot first, with 1-click switch to ChatGPT Studio
  fireEvent.click(getByTestId('insco-dual-ai-launcher'));
  assert.ok(getByTestId('ai-tab-copilot'));
  fireEvent.click(getByTestId('copilot-upgrade-chatgpt-btn'));
  assert.ok(getByTestId('insco-chatgpt-workspace'));

  // Select Reasoning Architecture + Web Search + High Thinking Effort
  fireEvent.change(getByTestId('chatgpt-arch-select'), {
    target: { value: 'first_principles' },
  });
  fireEvent.click(getByTestId('chatgpt-web-search-toggle'));
  fireEvent.click(getByTestId('chatgpt-think-high'));

  // Open Memory & Training Studio -> add Memory + toggle Training Playbook + add Custom Few-Shot Rule
  fireEvent.click(getByTestId('chatgpt-open-memory-btn'));
  assert.ok(getByTestId('chatgpt-memory-modal'));

  fireEvent.change(getByTestId('chatgpt-custom-instructions-input'), {
    target: { value: 'Respond with ASME tables.' },
  });
  fireEvent.change(getByTestId('chatgpt-new-memory-input'), {
    target: { value: 'Plant unit CDU-02' },
  });
  fireEvent.click(getByTestId('chatgpt-add-memory-btn'));

  // Switch to Training Packs & Reasoning tab
  fireEvent.click(getByTestId('chatgpt-modal-tab-training'));
  fireEvent.click(getByTestId('chatgpt-pack-executive_reports'));
  fireEvent.change(getByTestId('chatgpt-train-pattern-input'), {
    target: { value: 'RT Ug calculation' },
  });
  fireEvent.change(getByTestId('chatgpt-train-structure-input'), {
    target: { value: 'Show formula -> assumptions -> final limit check' },
  });
  fireEvent.click(getByTestId('chatgpt-add-training-btn'));

  fireEvent.click(
    getByTestId('chatgpt-memory-modal').querySelector('button[aria-label="Close"]')!
  );
  assert.equal(queryByTestId('chatgpt-memory-modal'), null);

  // Send streamed prompt
  fireEvent.change(getByTestId('chatgpt-composer-input'), {
    target: { value: 'Prepare RT technique sheet for 16mm P91 weld' },
  });
  fireEvent.click(getByTestId('chatgpt-send-btn'));

  await waitFor(() => {
    assert.ok(getByText('Inspection Summary'));
    assert.ok(getByTestId('chatgpt-canvas-panel'));
    assert.ok(getAllByText('RT Technique Sheet W-101').length >= 1);
    assert.ok(getByTestId('chatgpt-open-artifact-art-rt-1'));
    assert.ok(getByText('3 INSCO refs'));
  });

  // Verify posted payload carried reasoning architecture, training packs, custom few-shot, and memory
  const firstBody = postedBodies[0];
  assert.equal(firstBody['webSearchEnabled'], true);
  assert.equal(firstBody['thinkingEffort'], 'high');
  assert.equal(firstBody['reasoningArchitecture'], 'first_principles');
  assert.equal(firstBody['selfVerifyPass'], true);
  assert.ok((firstBody['trainingPacks'] as string[]).includes('executive_reports'));
  const sentMemory = firstBody['memoryProfile'] as Record<string, unknown>;
  assert.equal(sentMemory['customInstructions'], 'Respond with ASME tables.');
  assert.equal((sentMemory['fewShotExamples'] as unknown[]).length, 1);

  // Expand reasoning thoughts accordion
  fireEvent.click(getByText('Reasoning Process'));
  assert.ok(getByText(/Checking ASME Sec V Art 2 Table T-276/));

  // Grounding citation rendered safely
  assert.ok(getByText('ASME BPVC Sec V'));

  // Memory saved automatically by tool call persists in localStorage
  const savedProfile = chatgptStore.loadMemoryProfile();
  assert.ok(savedProfile.savedMemories.includes('Preferred code is ASME Sec V Art 2'));
  assert.ok(savedProfile.savedMemories.includes('Plant unit CDU-02'));
  assert.equal(savedProfile.fewShotExamples?.length, 1);

  // Run 1-click Verify Logic (CoVe) on turn index 1
  fireEvent.click(getByTestId('chatgpt-verify-turn-btn-1'));
  await waitFor(() => {
    assert.ok(getByText('CoVe Audit Passed'));
  });
  assert.ok(postedBodies[1]?.['verifyTargetTurn']);

  // Execute INSCO platform tool action (navigates to Workshop & closes drawer)
  fireEvent.click(getByText('Open Practical Workshop'));
  assert.deepEqual(visited, ['academy:sim_labs_rt']);
});

/* ---------------- 6. Stop Generation & Real Error Propagation ---------------- */

test('InscoChatGptWorkspace supports Stop generation abort and surfaces real backend errors cleanly', async () => {
  let aborted = false;
  let callCount = 0;

  globalThis.fetch = (async (_url: RequestInfo | URL, init?: RequestInit) => {
    callCount += 1;
    if (callCount === 1) {
      return new Response(
        new ReadableStream<Uint8Array>({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(
              encoder.encode('event: token\ndata: {"type":"token","delta":"Partial output..."}\n\n')
            );
            init?.signal?.addEventListener('abort', () => {
              aborted = true;
              try {
                controller.error(new Error('Aborted'));
              } catch {
                /* ignore */
              }
            });
          },
        }),
        { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
      );
    }

    return new Response(
      JSON.stringify({ error: { code: 'not_configured', message: 'Gemini API key is missing on the server.' } }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }) as typeof fetch;

  const { getByTestId, getByText } = render(
    <InscoDualAiDock
      language="en"
      portal="company"
      section="overview"
      onOpenCompany={() => {}}
      onOpenClient={() => {}}
      onOpenAcademy={() => {}}
    />
  );

  // Direct ChatGPT Studio launcher button
  fireEvent.click(getByTestId('insco-chatgpt-launcher'));

  fireEvent.change(getByTestId('chatgpt-composer-input'), {
    target: { value: 'Stream a long PAUT guide' },
  });
  fireEvent.click(getByTestId('chatgpt-send-btn'));

  await waitFor(() => {
    assert.ok(getByTestId('chatgpt-stop-btn'));
    assert.ok(getByText(/Partial output/));
  });

  fireEvent.click(getByTestId('chatgpt-stop-btn'));
  await waitFor(() => {
    assert.equal(aborted, true);
  });

  // Second request hits 503 -> must surface real error alert, zero mock fallback
  fireEvent.change(getByTestId('chatgpt-composer-input'), {
    target: { value: 'Try another query' },
  });
  fireEvent.click(getByTestId('chatgpt-send-btn'));

  await waitFor(() => {
    assert.ok(getByTestId('chatgpt-stream-error'));
    assert.ok(getByText(/Gemini API key is missing/));
  });
});

/* ---------------- 7. InscoDualAiDock Copilot LocalStorage History System ---------------- */

test('InscoDualAiDock saves, persists across remount, loads, renames, and deletes Copilot threads in LocalStorage', async () => {
  let reqCount = 0;
  globalThis.fetch = (async () => {
    reqCount += 1;
    return new Response(
      JSON.stringify({
        reply: reqCount === 1 ? 'Thread One Reply: Use Ir-192' : 'Thread Two Reply: Use PAUT 64-element',
        suggestedActions: [],
        model: 'gemini-4-hydrogen',
        elapsedMs: 120,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }) as typeof fetch;

  const ui1 = render(
    <InscoDualAiDock
      language="en"
      portal="company"
      section="overview"
      onOpenCompany={() => {}}
      onOpenClient={() => {}}
      onOpenAcademy={() => {}}
    />
  );

  fireEvent.click(ui1.getByTestId('insco-dual-ai-launcher'));
  const input1 = ui1.getByPlaceholderText(/Ask User Copilot/);
  fireEvent.change(input1, { target: { value: 'First thread Ir-192 question' } });
  fireEvent.submit(input1.closest('form')!);

  await waitFor(() => {
    assert.ok(ui1.getByText(/Thread One Reply: Use Ir-192/));
  });

  // Explicit Save Thread notice + start New Chat
  fireEvent.click(ui1.getByTestId('copilot-save-thread-btn'));
  assert.ok(ui1.getByText('Saved!'));

  fireEvent.click(ui1.getByTestId('copilot-new-chat-btn'));
  assert.equal(ui1.queryByText(/Thread One Reply/), null);

  const input2 = ui1.getByPlaceholderText(/Ask User Copilot/);
  fireEvent.change(input2, { target: { value: 'Second thread PAUT question' } });
  fireEvent.submit(input2.closest('form')!);

  await waitFor(() => {
    assert.ok(ui1.getByText(/Thread Two Reply: Use PAUT 64-element/));
  });

  // Simulate full page reload by unmounting & remounting InscoDualAiDock
  cleanup();

  const ui2 = render(
    <InscoDualAiDock
      language="en"
      portal="company"
      section="overview"
      onOpenCompany={() => {}}
      onOpenClient={() => {}}
      onOpenAcademy={() => {}}
    />
  );

  fireEvent.click(ui2.getByTestId('insco-dual-ai-launcher'));
  // Second thread automatically restored on mount
  assert.ok(ui2.getByText(/Thread Two Reply: Use PAUT 64-element/));

  // Open History drawer & verify both threads are present
  fireEvent.click(ui2.getByTestId('copilot-history-toggle'));
  const historyPanel = ui2.getByTestId('copilot-history-panel');
  assert.ok(historyPanel.textContent?.includes('First thread Ir-192 question'));
  assert.ok(historyPanel.textContent?.includes('Second thread PAUT question'));

  // Load the first thread back into active view
  const rawSaved = JSON.parse(
    localStorage.getItem('insco_dual_ai_copilot_threads_v1') || '{}'
  ) as { threads: Array<{ id: string; title: string }> };
  assert.equal(rawSaved.threads.length, 2);
  const firstThread = rawSaved.threads.find((t) => t.title.includes('First thread'))!;

  fireEvent.click(ui2.getByTestId(`copilot-thread-load-${firstThread.id}`));
  assert.ok(ui2.getByText(/Thread One Reply: Use Ir-192/));

  // Re-open History, rename first thread, then delete it
  fireEvent.click(ui2.getByTestId('copilot-history-toggle'));
  fireEvent.click(ui2.getByTestId(`copilot-thread-rename-${firstThread.id}`));
  const renameInput = ui2.getByTestId(`copilot-thread-rename-input-${firstThread.id}`);
  fireEvent.change(renameInput, { target: { value: 'Renamed Ir-192 Archive' } });
  fireEvent.submit(renameInput.closest('form')!);
  assert.ok(ui2.getByText('Renamed Ir-192 Archive'));

  fireEvent.click(ui2.getByTestId(`copilot-thread-delete-${firstThread.id}`));
  assert.equal(ui2.queryByText('Renamed Ir-192 Archive'), null);
});

