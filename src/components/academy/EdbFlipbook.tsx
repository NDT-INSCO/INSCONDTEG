import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FlaskConical,
  Info,
  List,
  Maximize2,
  Minimize2,
  Moon,
  Search,
  Sun,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Language } from '../../types';
import { EdbBlock, EdbDocument, EdbPage, EdbText } from '../../edb/types';
import {
  downloadEdb,
  epubAssetUrl,
  getEdbProgress,
  prettyFormula,
  saveEdbProgress,
  textOf,
} from '../../utils/edbLibrary';

interface EdbFlipbookProps {
  language: Language;
  book: EdbDocument;
  onClose: () => void;
  onOpenLab?: (labId: string) => void;
  /** 1-based page to open at; search results and tutor citations use it. */
  initialPageNumber?: number;
}

const FLIP_MS = 460;

function playPageSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const bufferSize = Math.floor(ctx.sampleRate * 0.16);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.045));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1750;
    filter.Q.value = 1.3;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.17);
    noise.onended = () => { void ctx.close(); };
  } catch {
    // Audio is optional.
  }
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

function blockText(block: EdbBlock): string {
  switch (block.type) {
    case 'paragraph':
    case 'heading':
      return `${block.text.ar} ${block.text.en}`;
    case 'list':
      return block.items.map(item => `${item.ar} ${item.en}`).join(' ');
    case 'quiz':
      return `${block.question.ar} ${block.question.en} ${block.options.map(o => `${o.ar} ${o.en}`).join(' ')}`;
    case 'formula':
      return `${block.expression} ${block.caption?.ar || ''} ${block.caption?.en || ''}`;
    case 'callout':
      return `${block.title?.ar || ''} ${block.title?.en || ''} ${block.text.ar} ${block.text.en}`;
    case 'source':
      return block.title;
    case 'experiment':
      return `${block.label.ar} ${block.label.en} ${block.experimentId}`;
    case 'image':
      return `${block.alt.ar} ${block.alt.en}`;
    default:
      return '';
  }
}

const EdbTextSpan: React.FC<{ value: EdbText; language: Language; className?: string }> = ({ value, language, className }) => (
  <span dir={language === 'ar' ? 'rtl' : 'ltr'} className={className}>
    {textOf(value, language)}
  </span>
);

interface BlockViewProps {
  block: EdbBlock;
  language: Language;
  accent: string;
  ink: string;
  muted: string;
  answers: Record<string, number>;
  checked: Record<string, boolean>;
  onAnswer: (id: string, index: number) => void;
  onCheck: (id: string) => void;
  onReset: (id: string) => void;
  onOpenLab?: (labId: string) => void;
}

const BlockView: React.FC<BlockViewProps> = ({
  block,
  language,
  accent,
  ink,
  muted,
  answers,
  checked,
  onAnswer,
  onCheck,
  onReset,
  onOpenLab,
}) => {
  const isAr = language === 'ar';
  switch (block.type) {
    case 'heading': {
      const size = block.level === 1 ? 'text-2xl sm:text-3xl' : block.level === 2 ? 'text-lg sm:text-xl' : 'text-base sm:text-lg';
      return <h3 className={`${size} font-black mt-6 mb-2`} style={{ color: block.level === 3 ? accent : ink }}><EdbTextSpan value={block.text} language={language} /></h3>;
    }
    case 'paragraph':
      return <p className="text-sm sm:text-[15px] leading-8 mb-4" style={{ color: ink }}><EdbTextSpan value={block.text} language={language} /></p>;
    case 'list':
      return (
        <ul className="space-y-2 mb-5 ps-5">
          {block.items.map((item, index) => (
            <li key={index} className="text-sm sm:text-[15px] leading-7 list-disc marker:opacity-70" style={{ color: ink }}>
              {block.ordered ? <span className="inline-block min-w-6 font-bold" style={{ color: accent }}>{index + 1}.</span> : null}
              <EdbTextSpan value={item} language={language} />
            </li>
          ))}
        </ul>
      );
    case 'formula':
      return (
        <figure className="my-5 rounded-2xl border p-4" style={{ borderColor: `${accent}55`, backgroundColor: `${accent}10` }}>
          <code dir="ltr" className="block text-center text-base sm:text-lg font-mono tracking-wide" style={{ color: ink }}>
            {prettyFormula(block.expression)}
          </code>
          {block.caption && <figcaption className="text-xs mt-3 text-center" style={{ color: muted }}><EdbTextSpan value={block.caption} language={language} /></figcaption>}
        </figure>
      );
    case 'callout': {
      const Icon = block.tone === 'warning' ? AlertTriangle : block.tone === 'success' ? CheckCircle2 : Info;
      const tone = block.tone === 'warning' ? '#f59e0b' : block.tone === 'success' ? '#34d399' : accent;
      return (
        <aside className="my-5 rounded-2xl border p-4" style={{ borderColor: `${tone}55`, backgroundColor: `${tone}12` }}>
          <div className="flex items-center gap-2 mb-2" style={{ color: tone }}>
            <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="text-xs font-black uppercase tracking-wide">{block.title ? textOf(block.title, language) : (block.tone === 'warning' ? (isAr ? 'تنبيه' : 'Caution') : block.tone === 'success' ? (isAr ? 'ملاحظة' : 'Note') : (isAr ? 'معلومة' : 'Information'))}</span>
          </div>
          <p className="text-sm leading-7" style={{ color: ink }}><EdbTextSpan value={block.text} language={language} /></p>
        </aside>
      );
    }
    case 'quiz': {
      const selected = answers[block.id];
      const isChecked = Boolean(checked[block.id]);
      const correct = selected === block.answer;
      return (
        <section className="my-6 rounded-2xl border p-4 sm:p-5" style={{ borderColor: `${accent}55`, backgroundColor: `${accent}0e` }}>
          <div className="flex items-center gap-2 mb-3" style={{ color: accent }}>
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs font-black uppercase tracking-wide">{isAr ? 'فحص فهم' : 'Knowledge check'}</span>
          </div>
          <p className="text-sm font-bold leading-7 mb-3" style={{ color: ink }}><EdbTextSpan value={block.question} language={language} /></p>
          <div role="radiogroup" aria-label={textOf(block.question, language)} className="space-y-2">
            {block.options.map((option, index) => {
              const isSelected = selected === index;
              const showCorrect = isChecked && index === block.answer;
              const showWrong = isChecked && isSelected && index !== block.answer;
              return (
                <button
                  key={index}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isChecked}
                  onClick={() => onAnswer(block.id, index)}
                  className="w-full text-start rounded-xl border px-3 py-2 text-sm transition disabled:cursor-default"
                  style={{
                    color: ink,
                    borderColor: showCorrect ? '#34d399' : showWrong ? '#f87171' : `${accent}44`,
                    backgroundColor: showCorrect ? '#34d39918' : showWrong ? '#f8717118' : isSelected ? `${accent}18` : 'transparent',
                  }}
                >
                  <span className="inline-block min-w-6 font-bold" style={{ color: accent }}>{String.fromCharCode(65 + index)}.</span>
                  <EdbTextSpan value={option} language={language} />
                </button>
              );
            })}
          </div>
          {!isChecked ? (
            <button
              type="button"
              disabled={selected === undefined}
              onClick={() => onCheck(block.id)}
              className="mt-3 rounded-lg px-4 py-2 text-xs font-black text-slate-950 disabled:opacity-40"
              style={{ backgroundColor: accent }}
            >
              {isAr ? 'تحقق من الإجابة' : 'Check answer'}
            </button>
          ) : (
            <div className="mt-3 space-y-2" role="status">
              <p className="text-sm font-bold" style={{ color: correct ? '#34d399' : '#f59e0b' }}>
                {correct ? (isAr ? 'إجابة صحيحة' : 'Correct') : (isAr ? 'راجع الفكرة ثم أعد المحاولة' : 'Review the idea and try again')}
              </p>
              <p className="text-sm leading-7" style={{ color: ink }}><EdbTextSpan value={block.explanation} language={language} /></p>
              <p className="text-xs" style={{ color: muted }}>{isAr ? 'الإجابة الصحيحة: ' : 'Correct answer: '}{textOf(block.options[block.answer], language)}</p>
              <button type="button" onClick={() => onReset(block.id)} className="text-xs underline" style={{ color: accent }}>
                {isAr ? 'إعادة المحاولة' : 'Try again'}
              </button>
            </div>
          )}
        </section>
      );
    }
    case 'source':
      return (
        <a
          href={block.url}
          target="_blank"
          rel="noopener noreferrer"
          className="my-2 flex items-start gap-2 rounded-xl border px-3 py-2 text-xs transition hover:opacity-90"
          style={{ borderColor: `${accent}33`, color: ink }}
        >
          <ExternalLink className="w-4 h-4 shrink-0 mt-0.5" style={{ color: accent }} aria-hidden="true" />
          <span>
            <span className="font-bold" style={{ color: accent }}>{block.publisher || 'Source'}</span>
            <span className="block" dir="ltr">{block.title}</span>
            <span className="block text-[10px] opacity-70">
              {isAr ? 'قراءة داعمة — يفتح في نافذة جديدة' : 'Supporting reading — opens in a new tab'}
            </span>
          </span>
        </a>
      );
    case 'experiment':
      return (
        <button
          type="button"
          onClick={() => onOpenLab?.(block.experimentId)}
          disabled={!onOpenLab}
          className="my-3 flex w-full items-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold disabled:opacity-60"
          style={{ borderColor: `${accent}44`, color: accent }}
        >
          <FlaskConical className="w-4 h-4" aria-hidden="true" />
          {textOf(block.label, language)}
        </button>
      );
    case 'image':
      return (
        <figure className="my-4">
          <img src={block.src} alt={textOf(block.alt, language)} className="w-full rounded-xl border" style={{ borderColor: `${accent}33` }} />
          <figcaption className="text-xs mt-2" style={{ color: muted }}>{textOf(block.alt, language)}</figcaption>
        </figure>
      );
    default:
      return null;
  }
};

interface PageSurfaceProps {
  book: EdbDocument;
  page: EdbPage;
  language: Language;
  answers: Record<string, number>;
  checked: Record<string, boolean>;
  onAnswer: (id: string, index: number) => void;
  onCheck: (id: string) => void;
  onReset: (id: string) => void;
  onOpenLab?: (labId: string) => void;
  themeMode: 'night' | 'paper';
  fontScale: 'sm' | 'md' | 'lg';
}

const PageSurface: React.FC<PageSurfaceProps> = ({
  book,
  page,
  language,
  answers,
  checked,
  onAnswer,
  onCheck,
  onReset,
  onOpenLab,
  themeMode,
  fontScale,
}) => {
  const isAr = language === 'ar';
  const night = themeMode === 'night';
  const paper = night ? book.theme.paper : '#f7f0df';
  const ink = night ? book.theme.ink : '#241f16';
  const muted = night ? '#94a3b8' : '#6b6250';
  const accent = night ? book.theme.accent : '#8a6517';
  const fontClass = fontScale === 'sm' ? 'text-xs sm:text-sm' : fontScale === 'lg' ? 'text-base sm:text-lg' : 'text-sm sm:text-base';

  if (page.kind === 'cover') {
    return (
      <div className="h-full flex flex-col justify-between p-6 sm:p-10" style={{ background: `linear-gradient(145deg, ${book.theme.accentSoft} 0%, ${paper} 62%)`, color: ink }}>
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border px-3 py-1 text-[10px] font-black tracking-[0.2em] uppercase" style={{ borderColor: `${accent}77`, color: accent }}>
            {textOf(book.theme.label, language)}
          </span>
          <span className="text-[10px] font-mono" style={{ color: muted }}>EDB v{book.version}</span>
        </div>
        <div className="py-6">
          <div className="w-16 h-1.5 rounded-full mb-6" style={{ backgroundColor: accent }} />
          <h1 className={`${fontScale === 'lg' ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-4xl'} font-black leading-tight`} style={{ color: ink }}>
            {textOf(book.metadata.title, language)}
          </h1>
          <p className="mt-4 text-sm sm:text-base leading-8" style={{ color: muted }}>{textOf(book.metadata.subtitle, language)}</p>
          <div className="mt-6 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-lg border px-2 py-1" style={{ borderColor: `${accent}44`, color: ink }}>{textOf(book.metadata.author, language)}</span>
            <span className="rounded-lg border px-2 py-1" style={{ borderColor: `${accent}44`, color: muted }}>{book.metadata.edition}</span>
            <span className="rounded-lg border px-2 py-1" style={{ borderColor: `${accent}44`, color: muted }}>{book.pages.length} {isAr ? 'صفحة' : 'pages'}</span>
          </div>
          {book.metadata.standards?.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5" dir="ltr">
              {book.metadata.standards.slice(0, 6).map(code => (
                <span key={code} className="rounded bg-black/10 px-2 py-1 text-[10px] font-mono" style={{ color: ink }}>{code}</span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="space-y-3">
          <div className="rounded-xl border p-3 text-[11px] leading-6" style={{ borderColor: `${accent}33`, color: muted }}>
            <EdbTextSpan value={book.metadata.rights.notice} language={language} />
          </div>
          {book.metadata.sourceNote && <p className="text-[10px] leading-5" style={{ color: muted }}><EdbTextSpan value={book.metadata.sourceNote} language={language} /></p>}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: paper, color: ink }}>
      <div className="flex items-center justify-between gap-3 px-5 sm:px-8 pt-5 pb-2">
        <span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: accent }}>
          {book.chapters.find(chapter => chapter.id === page.chapterId)?.title[language] || ''}
        </span>
        <span className="text-[10px] font-mono" style={{ color: muted }}>{isAr ? 'صفحة' : 'Page'} {page.number} / {book.pages.length}</span>
      </div>
      <div className={`flex-1 overflow-y-auto px-5 sm:px-8 pb-6 ${fontClass}`}>
        <h2 className={`${fontScale === 'lg' ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} font-black leading-snug mt-2 mb-5`} style={{ color: ink }}>
          {textOf(page.title, language)}
        </h2>
        {page.blocks.map((block, index) => (
          <BlockView
            key={`${page.id}-${index}`}
            block={block}
            language={language}
            accent={accent}
            ink={ink}
            muted={muted}
            answers={answers}
            checked={checked}
            onAnswer={onAnswer}
            onCheck={onCheck}
            onReset={onReset}
            onOpenLab={onOpenLab}
          />
        ))}
      </div>
      <div className="flex items-center justify-between px-5 sm:px-8 py-3 text-[10px]" style={{ borderTop: `1px solid ${accent}22`, color: muted }}>
        <span>{book.metadata.publisher}</span>
        <span className="font-mono">{page.number}</span>
      </div>
    </div>
  );
};

export const EdbFlipbook: React.FC<EdbFlipbookProps> = ({ language, book, onClose, onOpenLab, initialPageNumber }) => {
  const isAr = language === 'ar';
  const initialProgress = useMemo(() => getEdbProgress(book.id), [book.id]);
  const requested = typeof initialPageNumber === 'number' ? initialPageNumber - 1 : initialProgress.lastPage - 1;
  const initialIndex = Math.min(Math.max(requested, 0), book.pages.length - 1);

  const [pageIndex, setPageIndex] = useState(initialIndex);
  const [flipPage, setFlipPage] = useState<EdbPage | null>(null);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [progress, setProgress] = useState(initialProgress);
  const [showToc, setShowToc] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState('');
  const [sound, setSound] = useState(true);
  const [themeMode, setThemeMode] = useState<'night' | 'paper'>('night');
  const [fontScale, setFontScale] = useState<'sm' | 'md' | 'lg'>('md');
  const [fullscreen, setFullscreen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const flippingRef = useRef(false);
  const touchStart = useRef<number | null>(null);

  const page = book.pages[pageIndex] || book.pages[0];
  const total = book.pages.length;
  const progressPercent = Math.round((progress.readPages.length / total) * 100);

  const persist = useCallback((patch: Partial<typeof progress>) => {
    const next = saveEdbProgress(book.id, patch);
    setProgress(next);
  }, [book.id]);

  const markRead = useCallback((pageNumber: number) => {
    const readPages = [...new Set([...progress.readPages, pageNumber])].sort((a, b) => a - b);
    persist({ readPages, lastPage: pageNumber });
  }, [persist, progress.readPages]);

  useEffect(() => {
    markRead(page.number);
    // Only page transitions should mark a page; reading progress is local.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.number]);

  const goTo = useCallback((targetIndex: number, direction?: 'next' | 'prev') => {
    if (flippingRef.current) return;
    const bounded = Math.min(Math.max(targetIndex, 0), book.pages.length - 1);
    if (bounded === pageIndex) return;
    flippingRef.current = true;
    setFlipPage(book.pages[pageIndex]);
    setFlipDirection(direction || (bounded > pageIndex ? 'next' : 'prev'));
    setPageIndex(bounded);
    if (sound) playPageSound();
    window.setTimeout(() => {
      setFlipPage(null);
      flippingRef.current = false;
    }, FLIP_MS);
  }, [book.pages, pageIndex, sound]);

  const next = useCallback(() => goTo(pageIndex + 1, 'next'), [goTo, pageIndex]);
  const previous = useCallback(() => goTo(pageIndex - 1, 'prev'), [goTo, pageIndex]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (event.key === 'Escape') {
        if (showSearch) setShowSearch(false);
        else if (showToc) setShowToc(false);
        else onClose();
      } else if (event.key === 'ArrowRight') {
        if (isAr) previous(); else next();
      } else if (event.key === 'ArrowLeft') {
        if (isAr) next(); else previous();
      } else if (event.key === 'PageDown') {
        next();
      } else if (event.key === 'PageUp') {
        previous();
      } else if (event.key === 'Home') {
        goTo(0, 'prev');
      } else if (event.key === 'End') {
        goTo(total - 1, 'next');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goTo, isAr, next, onClose, previous, showSearch, showToc, total]);

  const searchResults = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return book.pages
      .filter(item => normalize(`${item.title.ar} ${item.title.en} ${item.blocks.map(blockText).join(' ')}`).includes(q))
      .slice(0, 24);
  }, [book.pages, query]);

  const toggleBookmark = () => {
    const bookmarks = progress.bookmarks.includes(page.number)
      ? progress.bookmarks.filter(item => item !== page.number)
      : [...progress.bookmarks, page.number];
    persist({ bookmarks, lastPage: page.number });
  };

  const handleAnswer = (id: string, index: number) => setAnswers(prev => ({ ...prev, [id]: index }));
  const handleCheck = (id: string) => setChecked(prev => ({ ...prev, [id]: true }));
  const handleReset = (id: string) => {
    setChecked(prev => ({ ...prev, [id]: false }));
    setAnswers(prev => {
      const nextAnswers = { ...prev };
      delete nextAnswers[id];
      return nextAnswers;
    });
  };

  const isBookmarked = progress.bookmarks.includes(page.number);
  const night = themeMode === 'night';
  const shellBg = night ? '#06070f' : '#2d2a24';
  const paperBg = night ? book.theme.paper : '#f7f0df';

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={`${fullscreen ? 'fixed inset-0 z-[90]' : 'relative'} rounded-2xl overflow-hidden border border-white/10`}
      style={{ backgroundColor: shellBg }}
    >
      <style>{`
        @keyframes edbFlipNext {
          0% { transform: rotateY(0deg); opacity: 1; }
          100% { transform: rotateY(-105deg); opacity: 0; }
        }
        @keyframes edbFlipPrev {
          0% { transform: rotateY(0deg); opacity: 1; }
          100% { transform: rotateY(105deg); opacity: 0; }
        }
        .edb-flip-next { animation: edbFlipNext ${FLIP_MS}ms cubic-bezier(.2,.7,.2,1) forwards; transform-origin: ${isAr ? 'right' : 'left'} center; backface-visibility: hidden; }
        .edb-flip-prev { animation: edbFlipPrev ${FLIP_MS}ms cubic-bezier(.2,.7,.2,1) forwards; transform-origin: ${isAr ? 'left' : 'right'} center; backface-visibility: hidden; }
        .edb-perspective { perspective: 2200px; }
        .edb-page-shadow { box-shadow: 0 30px 70px rgba(0,0,0,.45), inset 0 0 40px rgba(0,0,0,.18); }
        .edb-paper-texture { background-image: radial-gradient(rgba(255,255,255,.035) 1px, transparent 1px); background-size: 5px 5px; }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 sm:px-4 py-2.5 text-slate-200">
        <div className="flex items-center gap-2 min-w-0">
          <button type="button" onClick={onClose} className="rounded-lg border border-white/15 p-2 hover:bg-white/10" aria-label={isAr ? 'إغلاق الكتاب' : 'Close book'}>
            <ArrowLeft className={`w-4 h-4 ${isAr ? '' : 'rotate-180'}`} />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-black truncate max-w-[48vw]">{textOf(book.metadata.title, language)}</p>
            <p className="text-[10px] text-slate-400 truncate">{isAr ? 'قارئ EDB — تقليب صفحات ثلاثي الأبعاد' : 'EDB reader — 3D page flip'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => setShowToc(true)} className="rounded-lg border border-white/15 p-2 hover:bg-white/10" aria-label={isAr ? 'المحتويات' : 'Contents'} title={isAr ? 'المحتويات' : 'Contents'}>
            <List className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setShowSearch(true)} className="rounded-lg border border-white/15 p-2 hover:bg-white/10" aria-label={isAr ? 'ابحث داخل الكتاب' : 'Search this book'} title={isAr ? 'بحث' : 'Search'}>
            <Search className="w-4 h-4" />
          </button>
          <button type="button" onClick={toggleBookmark} className="rounded-lg border border-white/15 p-2 hover:bg-white/10" aria-pressed={isBookmarked} aria-label={isAr ? 'إشارة مرجعية' : 'Bookmark'} title={isAr ? 'إشارة مرجعية' : 'Bookmark'}>
            {isBookmarked ? <BookmarkCheck className="w-4 h-4 text-amber-400" /> : <Bookmark className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => setThemeMode(night ? 'paper' : 'night')} className="rounded-lg border border-white/15 p-2 hover:bg-white/10" aria-label={isAr ? 'تبديل الورق' : 'Toggle paper theme'} title={isAr ? 'ورق / ليلي' : 'Paper / night'}>
            {night ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => setFontScale(fontScale === 'sm' ? 'md' : fontScale === 'md' ? 'lg' : 'sm')} className="rounded-lg border border-white/15 px-2 py-2 text-[11px] font-black hover:bg-white/10" aria-label={isAr ? 'حجم الخط' : 'Font size'} title={isAr ? 'حجم الخط' : 'Font size'}>
            Aa
          </button>
          <button type="button" onClick={() => setSound(value => !value)} className="rounded-lg border border-white/15 p-2 hover:bg-white/10" aria-pressed={sound} aria-label={isAr ? 'صوت التقليب' : 'Page sound'} title={isAr ? 'صوت التقليب' : 'Page sound'}>
            {sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => setFullscreen(value => !value)} className="rounded-lg border border-white/15 p-2 hover:bg-white/10" aria-label={isAr ? 'ملء الشاشة' : 'Fullscreen'} title={isAr ? 'ملء الشاشة' : 'Fullscreen'}>
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <a
            href={epubAssetUrl(book.id)}
            download
            className="flex items-center gap-1 rounded-lg border border-emerald-400/40 px-2 py-2 text-[10px] font-black text-emerald-300 hover:bg-emerald-400/10"
            aria-label={isAr ? 'تنزيل نسخة EPUB للقراء الإلكترونيين' : 'Download the EPUB edition for e-readers'}
            title={isAr ? 'تنزيل EPUB (Kindle / Kobo / Apple Books)' : 'Download EPUB (Kindle / Kobo / Apple Books)'}
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">EPUB</span>
          </a>
          <button type="button" onClick={() => downloadEdb(book)} className="rounded-lg border border-white/15 p-2 hover:bg-white/10" aria-label={isAr ? 'تنزيل .EDB' : 'Download .EDB'} title={isAr ? 'تنزيل .EDB' : 'Download .EDB'}>
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 px-3 sm:px-5 py-2 text-[10px] text-slate-400">
        <span className="font-mono">{page.number} / {total}</span>
        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-label={isAr ? 'تقدم قراءة EDB' : 'EDB reading progress'} aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full" style={{ width: `${progressPercent}%`, backgroundColor: book.theme.accent }} />
        </div>
        <span className="font-mono">{progressPercent}%</span>
        <span className="hidden sm:inline">{isAr ? 'محفوظ محلياً في هذا المتصفح' : 'Saved locally in this browser'}</span>
      </div>

      <div className={`edb-perspective px-2 sm:px-6 pb-2 ${fullscreen ? 'h-[calc(100vh-110px)]' : ''}`}>
        <div className="relative mx-auto max-w-4xl edb-page-shadow rounded-xl overflow-hidden edb-paper-texture" style={{ backgroundColor: paperBg, height: fullscreen ? '100%' : 'min(74vh, 760px)' }}>
          <PageSurface
            book={book}
            page={page}
            language={language}
            answers={answers}
            checked={checked}
            onAnswer={handleAnswer}
            onCheck={handleCheck}
            onReset={handleReset}
            onOpenLab={onOpenLab}
            themeMode={themeMode}
            fontScale={fontScale}
          />
          {flipPage && (
            <div
              className={`absolute inset-0 ${flipDirection === 'next' ? 'edb-flip-next' : 'edb-flip-prev'}`}
              style={{ backgroundColor: paperBg }}
              aria-hidden="true"
            >
              <PageSurface
                book={book}
                page={flipPage}
                language={language}
                answers={answers}
                checked={checked}
                onAnswer={handleAnswer}
                onCheck={handleCheck}
                onReset={handleReset}
                onOpenLab={onOpenLab}
                themeMode={themeMode}
                fontScale={fontScale}
              />
            </div>
          )}
          <button
            type="button"
            onClick={previous}
            disabled={pageIndex === 0}
            className="absolute top-1/2 start-1 -translate-y-1/2 rounded-full bg-black/35 p-2 text-white backdrop-blur disabled:opacity-20"
            aria-label={isAr ? 'الصفحة السابقة' : 'Previous page'}
          >
            {isAr ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={pageIndex === total - 1}
            className="absolute top-1/2 end-1 -translate-y-1/2 rounded-full bg-black/35 p-2 text-white backdrop-blur disabled:opacity-20"
            aria-label={isAr ? 'الصفحة التالية' : 'Next page'}
          >
            {isAr ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div
        className="px-3 sm:px-6 pb-4 pt-1 flex items-center justify-between text-[10px] text-slate-500"
        onTouchStart={event => { touchStart.current = event.touches[0]?.clientX ?? null; }}
        onTouchEnd={event => {
          if (touchStart.current === null) return;
          const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStart.current;
          touchStart.current = null;
          if (Math.abs(delta) < 55) return;
          const forward = isAr ? delta > 0 : delta < 0;
          if (forward) next(); else previous();
        }}
      >
        <span>{isAr ? 'اسحب أو استخدم الأسهم للتقليب • EDB v1.0' : 'Swipe or use arrows to turn pages • EDB v1.0'}</span>
        <span className="font-mono">{isAr ? 'استخدم ← →' : 'Use ← →'}</span>
      </div>

      {showToc && (
        <div className="absolute inset-0 z-20 flex" role="dialog" aria-modal="true" aria-label={isAr ? 'محتويات الكتاب' : 'Book contents'}>
          <button type="button" className="absolute inset-0 bg-black/55" onClick={() => setShowToc(false)} aria-label={isAr ? 'إغلاق' : 'Close'} />
          <aside className="relative ms-auto h-full w-full max-w-sm overflow-y-auto border-s border-white/10 bg-[#0b0d1e] p-4 text-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm flex items-center gap-2"><List className="w-4 h-4 text-amber-400" />{isAr ? 'المحتويات' : 'Contents'}</h3>
              <button type="button" onClick={() => setShowToc(false)} className="rounded p-1 hover:bg-white/10" aria-label={isAr ? 'إغلاق' : 'Close'}><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[10px] text-slate-400 mb-3">{isAr ? 'اختر فصلاً أو صفحة. الصفحات المقروءة عليها علامة.' : 'Pick a chapter or page. Read pages are marked.'}</p>
            {book.chapters.map(chapter => (
              <div key={chapter.id} className="mb-4">
                <p className="text-[11px] font-black text-amber-300 mb-1.5">{textOf(chapter.title, language)}</p>
                <div className="space-y-1">
                  {chapter.pageIds.map(id => {
                    const item = book.pages.find(candidate => candidate.id === id);
                    if (!item) return null;
                    const read = progress.readPages.includes(item.number);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => { goTo(item.number - 1); setShowToc(false); }}
                        className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-start text-[11px] hover:bg-white/10 ${item.number === page.number ? 'bg-white/10 text-white' : 'text-slate-300'}`}
                      >
                        <span className="font-mono text-[10px] text-slate-500 w-6 shrink-0">{item.number}</span>
                        <span className="flex-1">{textOf(item.title, language)}</span>
                        {read && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" aria-label={isAr ? 'مقروءة' : 'Read'} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {progress.bookmarks.length > 0 && (
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="text-[11px] font-black text-amber-300 mb-2">{isAr ? 'الإشارات المرجعية' : 'Bookmarks'}</p>
                <div className="flex flex-wrap gap-1.5">
                  {progress.bookmarks.map(number => (
                    <button key={number} type="button" onClick={() => { goTo(number - 1); setShowToc(false); }} className="rounded border border-amber-400/30 px-2 py-1 text-[10px] text-amber-200 hover:bg-amber-500/10">
                      {isAr ? 'صفحة' : 'Page'} {number}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {showSearch && (
        <div className="absolute inset-0 z-20 flex" role="dialog" aria-modal="true" aria-label={isAr ? 'بحث داخل الكتاب' : 'Search inside the book'}>
          <button type="button" className="absolute inset-0 bg-black/55" onClick={() => setShowSearch(false)} aria-label={isAr ? 'إغلاق' : 'Close'} />
          <aside className="relative ms-auto h-full w-full max-w-sm overflow-y-auto border-s border-white/10 bg-[#0b0d1e] p-4 text-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-sm flex items-center gap-2"><Search className="w-4 h-4 text-amber-400" />{isAr ? 'بحث داخل الكتاب' : 'Search this book'}</h3>
              <button type="button" onClick={() => setShowSearch(false)} className="rounded p-1 hover:bg-white/10" aria-label={isAr ? 'إغلاق' : 'Close'}><X className="w-4 h-4" /></button>
            </div>
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              autoFocus
              placeholder={isAr ? 'اكتب كلمة أو مصطلحاً…' : 'Type a word or term…'}
              className="w-full rounded-xl border border-[#29315b] bg-[#10132b] px-3 py-2 text-sm text-white"
              aria-label={isAr ? 'بحث داخل الكتاب' : 'Search inside the book'}
            />
            <p className="text-[10px] text-slate-400 mt-2">{query.trim() ? (isAr ? `${searchResults.length} نتيجة` : `${searchResults.length} result(s)`) : (isAr ? 'يبحث في العناوين والنصوص.' : 'Searches titles and body text.')}</p>
            <div className="mt-3 space-y-2">
              {searchResults.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => { goTo(item.number - 1); setShowSearch(false); }}
                  className="block w-full rounded-lg border border-[#29315b] p-2 text-start hover:border-amber-400/70"
                >
                  <span className="block text-[10px] font-mono text-amber-400">{isAr ? 'صفحة' : 'Page'} {item.number}</span>
                  <span className="block text-xs text-slate-100 mt-0.5">{textOf(item.title, language)}</span>
                </button>
              ))}
              {query.trim() && searchResults.length === 0 && <p className="text-xs text-slate-400">{isAr ? 'لا توجد نتائج.' : 'No results.'}</p>}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};
