import React from 'react';
import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'https://example.org/-Project-/#academy',
  pretendToBeVisual: true,
});

Object.assign(globalThis, {
  window: dom.window,
  document: dom.window.document,
  localStorage: dom.window.localStorage,
  HTMLElement: dom.window.HTMLElement,
  HTMLSelectElement: dom.window.HTMLSelectElement,
  CustomEvent: dom.window.CustomEvent,
  Event: dom.window.Event,
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  IS_REACT_ACT_ENVIRONMENT: true,
});

if (!dom.window.HTMLElement.prototype.scrollIntoView) {
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
}

if (!dom.window.HTMLCanvasElement.prototype.getContext) {
  dom.window.HTMLCanvasElement.prototype.getContext = (() => ({
    fillRect() {},
    clearRect() {},
    getImageData() {
      return { data: [] };
    },
    putImageData() {},
    createImageData() {
      return [];
    },
    setTransform() {},
    drawImage() {},
    save() {},
    fillText() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    stroke() {},
    fill() {},
    arc() {},
    createLinearGradient() {
      return { addColorStop() {} };
    },
    setLineDash() {},
  })) as unknown as typeof dom.window.HTMLCanvasElement.prototype.getContext;
}

const { render, fireEvent, cleanup, within } = await import('@testing-library/react');
const { NDT_TEXTBOOKS } = await import('../src/data/ndeTextbooksData');
const {
  buildTextbookKnowledgeCheckDeck,
  buildEdbKnowledgeCheckDeck,
  getBookQuickCheckRecord,
} = await import('../src/utils/textbookKnowledgeCheckBank');
const { QuickKnowledgeCheckQuiz } = await import(
  '../src/components/academy/QuickKnowledgeCheckQuiz'
);
const { NdeEncyclopediaView } = await import(
  '../src/components/academy/NdeEncyclopediaView'
);
const { EdbFlipbook } = await import('../src/components/academy/EdbFlipbook');
const { setTheme } = await import('../src/utils/themeStore');

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test('buildTextbookKnowledgeCheckDeck builds valid multi-question decks for every loaded NDT textbook', () => {
  for (const book of NDT_TEXTBOOKS) {
    const deck = buildTextbookKnowledgeCheckDeck(book, {
      scope: 'loaded_book',
      maxQuestions: 8,
    });
    assert.ok(deck.length >= 4, `Expected >=4 questions for ${book.id}, got ${deck.length}`);

    for (const q of deck) {
      assert.equal(q.bookId, book.id);
      assert.ok(q.sourcePageNumber >= 1 && q.sourcePageNumber <= book.pages.length);
      assert.equal(q.optionsEn.length, 4);
      assert.equal(q.optionsAr.length, 4);
      assert.ok(q.correctIndex >= 0 && q.correctIndex < 4);
      assert.ok(q.explanationEn.length > 15);
      assert.ok(q.explanationAr.length > 15);
    }

    const pageDeck = buildTextbookKnowledgeCheckDeck(book, {
      scope: 'current_page',
      pageNumber: 1,
    });
    assert.ok(pageDeck.length >= 2);
    assert.ok(pageDeck.every(item => item.sourcePageNumber === 1));
  }
});

test('QuickKnowledgeCheckQuiz evaluates answers immediately, displays explanations, allows retry, and jumps to source page', () => {
  const utBook = NDT_TEXTBOOKS.find(b => b.id === 'book-ut')!;
  const deck = buildTextbookKnowledgeCheckDeck(utBook, {
    scope: 'loaded_book',
    maxQuestions: 6,
  });
  const firstQ = deck[0];
  const wrongIndex = (firstQ.correctIndex + 1) % 4;

  let jumpedPage: number | null = null;

  const ui = render(
    <QuickKnowledgeCheckQuiz
      language="en"
      textbook={utBook}
      activePageNumber={1}
      maxQuestions={6}
      onJumpToPage={p => {
        jumpedPage = p;
      }}
    />
  );

  assert.ok(ui.getByText(/Quick Knowledge Check: Academic Textbook of Ultrasonic Testing/i));
  assert.equal(ui.queryByTestId('quick-check-explanation'), null);

  // 1. Select an incorrect answer -> immediate feedback & explanation appear
  fireEvent.click(ui.getByTestId(`quick-check-option-${wrongIndex}`));

  const explanationBox = ui.getByTestId('quick-check-explanation');
  assert.ok(explanationBox);
  assert.match(
    ui.getByTestId('quick-check-verdict').textContent || '',
    /Incorrect — Review the textbook explanation below/i
  );
  assert.ok(
    (explanationBox.textContent || '').includes(firstQ.explanationEn),
    'Should display full scientific explanation immediately'
  );
  assert.match(ui.getByTestId('quick-check-score').textContent || '', /Score: 0\/1 \(0%\)/);

  // 2. Click "Review Page X" to jump reader to source page
  fireEvent.click(ui.getByTestId('quick-check-jump-page'));
  assert.equal(jumpedPage, firstQ.sourcePageNumber);

  // 3. Retry question and select the correct answer
  fireEvent.click(ui.getByTestId('quick-check-retry-question'));
  assert.equal(ui.queryByTestId('quick-check-explanation'), null);

  fireEvent.click(ui.getByTestId(`quick-check-option-${firstQ.correctIndex}`));
  assert.match(
    ui.getByTestId('quick-check-verdict').textContent || '',
    /Correct — Verified against loaded textbook content/i
  );
  assert.match(ui.getByTestId('quick-check-score').textContent || '', /Score: 1\/1 \(100%\)/);

  // 4. Verify persistence in localStorage
  const saved = getBookQuickCheckRecord('book-ut');
  assert.ok(saved.correctIds.includes(firstQ.id));
});

test('NdeEncyclopediaView synchronizes QuickKnowledgeCheckQuiz dynamically when switching loaded NDT textbooks and themes', () => {
  setTheme('light');
  const ui = render(<NdeEncyclopediaView language="en" initialBookId="book-ut" />);

  const quizSection = ui.getByTestId('quick-knowledge-check');
  assert.ok(
    within(quizSection).getByText(/Quick Knowledge Check: Academic Textbook of Ultrasonic Testing/i)
  );

  // Switch loaded textbook via the Quick Knowledge Check selector to Radiographic Testing (book-rt)
  const bookSelect = within(quizSection).getByTestId('quick-check-book-select');
  fireEvent.change(bookSelect, { target: { value: 'book-rt' } });

  const rtBook = NDT_TEXTBOOKS.find(b => b.id === 'book-rt')!;
  const heading = within(quizSection).getByRole('heading', { level: 3 });
  assert.ok((heading.textContent || '').includes(rtBook.titleEn));

  // Verify the question now tests Radiographic Testing (Inverse Square Law on RT page 1)
  assert.match(
    within(quizSection).getByTestId('quick-check-question-text').textContent || '',
    /Inverse Square Law|radiation/i
  );

  // Switch scope to Current Page
  fireEvent.click(within(quizSection).getByTestId('quick-check-scope-page'));
  assert.match(
    within(quizSection).getByTestId('quick-check-question-text').textContent || '',
    /Inverse Square Law/i
  );
});

test('EdbFlipbook opens Quick Knowledge Check for loaded .edb textbooks with immediate explanations in Arabic', () => {
  const sampleEdbBook = {
    format: 'EDB' as const,
    version: '1.0' as const,
    id: 'edb-ut-sample',
    generator: 'INSCO-EDB-Builder/1.0',
    theme: {
      accent: '#f59e0b',
      accentSoft: '#451a03',
      ink: '#f8fafc',
      paper: '#0f172a',
      label: { ar: 'مرجع الموجات فوق الصوتية', en: 'UT Reference' },
    },
    metadata: {
      title: { ar: 'أساسيات الفحص بالموجات فوق الصوتية', en: 'Ultrasonic Testing Essentials' },
      subtitle: { ar: 'فيزياء الصوت والمعايرة', en: 'Acoustics & Calibration' },
      author: { ar: 'أكاديمية إنسكو', en: 'INSCO Academy' },
      publisher: 'INSCO',
      edition: '2026',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
      languages: ['ar' as const, 'en' as const],
      readingDirection: 'auto' as const,
      estimatedMinutes: 25,
      keywords: [{ ar: 'موجات', en: 'ultrasonic' }],
      rights: {
        holder: 'INSCO',
        license: 'Educational',
        notice: { ar: 'للتعليم الذاتي', en: 'Self-study' },
      },
      standards: ['ASME Sec V Art 4'],
      relatedDiscipline: 'UT',
    },
    chapters: [
      {
        id: 'ch-1',
        title: { ar: 'الفصل الأول: انتشار الموجات', en: 'Chapter 1: Wave Propagation' },
        pageIds: ['p-1'],
      },
    ],
    pages: [
      {
        id: 'p-1',
        number: 1,
        chapterId: 'ch-1',
        kind: 'content' as const,
        title: { ar: 'الممانعة الصوتية والانعكاس', en: 'Acoustic Impedance & Reflection' },
        blocks: [
          {
            type: 'formula' as const,
            expression: 'Z = rho * V',
            caption: {
              ar: 'حاصل ضرب كثافة المادة في سرعة انتشار الموجة الصوتية',
              en: 'Product of material density and acoustic wave velocity',
            },
          },
          {
            type: 'quiz' as const,
            id: 'q-imp-1',
            question: {
              ar: 'ما الذي يحدد نسبة انعكاس الطاقة الصوتية عند السطح الفاصل بين مادتين؟',
              en: 'What governs acoustic reflection at an interface between two media?',
            },
            options: [
              { ar: 'فرق الممانعة الصوتية (Acoustic Impedance Mismatch)', en: 'Acoustic impedance mismatch' },
              { ar: 'لون معدن الأساس فقط', en: 'Base metal color only' },
              { ar: 'طول كابل المحول الكهربائي', en: 'Coaxial cable length' },
              { ar: 'شدة الإضاءة في موقع العمل', en: 'Ambient shop illumination' },
            ],
            answer: 0,
            explanation: {
              ar: 'كلما زاد التباين في الممانعة الصوتية (Z1 و Z2) بين الوسطين زادت نسبة الطاقة الصوتية المنعكسة.',
              en: 'Greater mismatch between acoustic impedances Z1 and Z2 produces higher interface reflection.',
            },
          },
        ],
      },
    ],
  };

  const edbDeck = buildEdbKnowledgeCheckDeck(sampleEdbBook);
  assert.equal(edbDeck.length, 2);

  const ui = render(
    <EdbFlipbook language="ar" book={sampleEdbBook} onClose={() => {}} />
  );

  fireEvent.click(ui.getByTestId('edb-open-quick-check'));

  const quiz = ui.getByTestId('quick-knowledge-check');
  assert.ok(within(quiz).getByText(/أساسيات الفحص بالموجات فوق الصوتية/));

  // Answer first question (authored quiz block, correctIndex = 0)
  fireEvent.click(within(quiz).getByTestId('quick-check-option-0'));
  assert.match(
    within(quiz).getByTestId('quick-check-explanation').textContent || '',
    /كلما زاد التباين في الممانعة الصوتية/
  );
});
