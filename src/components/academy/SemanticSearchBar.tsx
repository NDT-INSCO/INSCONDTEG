import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, CornerDownLeft, GraduationCap, Layers, Search, X } from 'lucide-react';
import { Language } from '../../types';
import { CorpusDocument, getCorpusStats, targetOf } from '../../ai/corpus';
import { SearchHit, searchLibrary } from '../../ai/search';
import { textOf } from '../../utils/edbLibrary';

export interface SearchTarget {
  tab: 'edb' | 'courses';
  bookId?: string;
  pageNumber?: number;
  courseId?: string;
}

interface SemanticSearchBarProps {
  language: Language;
  /** Jump into the curriculum module shown in the search results. */
  onNavigateToModule?: (disciplineId: string, levelIdx: number, moduleId?: string) => void;
  /** Launch the module self-check for the selected result. */
  onLaunchQuiz?: (disciplineId: string, levelId?: string, moduleId?: string, moduleTitle?: { ar: string; en: string }) => void;
  /** Open the exact book page or course a hit points at. */
  onOpenTarget?: (target: SearchTarget) => void;
  /** Hand the question to the tutor instead of searching. */
  onAskTutor?: (question: string) => void;
}

const KIND_LABEL: Record<CorpusDocument['kind'], { ar: string; en: string }> = {
  textbook: { ar: 'كتاب', en: 'Textbook' },
  course: { ar: 'مقرر', en: 'Course' },
  lesson: { ar: 'درس', en: 'Lesson' },
};

function KindIcon({ kind }: { kind: CorpusDocument['kind'] }) {
  if (kind === 'lesson') return <GraduationCap className="w-3.5 h-3.5" aria-hidden="true" />;
  if (kind === 'course') return <Layers className="w-3.5 h-3.5" aria-hidden="true" />;
  return <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />;
}

/**
 * Library search.
 *
 * Replaces a decorative input that had no handler: it rendered, accepted text
 * and returned nothing. This one runs the real BM25 index locally, so it works
 * on the static GitHub Pages build with no server and no key.
 */
export const SemanticSearchBar: React.FC<SemanticSearchBarProps> = ({
  language,
  onOpenTarget,
  onAskTutor,
}) => {
  const isAr = language === 'ar';
  // Counts come from the corpus, not from a copy-pasted sentence.
  const stats = useMemo(() => getCorpusStats(), []);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const result = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return null;
    try {
      return searchLibrary(trimmed, { limit: 6 });
    } catch {
      return null;
    }
  }, [query]);

  const hits = result?.hits ?? [];

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, []);

  const openHit = (hit: SearchHit) => {
    setOpen(false);
    onOpenTarget?.(targetOf(hit.document));
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown' && hits.length) {
      event.preventDefault();
      setOpen(true);
      setActive(index => (index + 1) % hits.length);
      return;
    }
    if (event.key === 'ArrowUp' && hits.length) {
      event.preventDefault();
      setOpen(true);
      setActive(index => (index - 1 + hits.length) % hits.length);
      return;
    }
    if (event.key === 'Enter') {
      if (open && hits[active]) {
        event.preventDefault();
        openHit(hits[active]);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="relative block">
        <span className="sr-only">{isAr ? 'ابحث في مكتبة إنسكو' : 'Search the INSCO library'}</span>
        <Search className="pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={event => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open && Boolean(result)}
          aria-controls="library-search-results"
          aria-autocomplete="list"
          placeholder={
            isAr
              ? `ابحث في ${stats.pages} صفحة و${stats.lessons} درساً… (مثال: الإضاءة، PWHT، lack of fusion)`
              : `Search ${stats.pages} pages and ${stats.lessons} lessons… (e.g. illumination, PWHT, lack of fusion)`
          }
          className="w-full rounded-xl border border-[#29315b] bg-[#0b0d1e] py-2.5 ps-9 pe-9 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setOpen(false);
            }}
            aria-label={isAr ? 'مسح البحث' : 'Clear search'}
            className="absolute top-1/2 end-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </label>

      {open && result && (
        <div
          id="library-search-results"
          role="listbox"
          aria-label={isAr ? 'نتائج البحث' : 'Search results'}
          className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-[#2a3260] bg-[#0b0d1e] shadow-2xl"
        >
          <div className="border-b border-[#212747] px-3 py-2 text-[10px] text-slate-400">
            {result.confident
              ? isAr
                ? `${hits.length} نتيجة من ${result.indexed} مستنداً`
                : `${hits.length} of ${result.indexed} documents`
              : isAr
                ? 'لا تطابق مؤكد — جرّب كلمة أو صياغة أخرى'
                : 'No confident match — try another term'}
          </div>

          {hits.length > 0 && (
            <ul className="max-h-[320px] overflow-y-auto">
              {hits.map((hit, index) => {
                const snippet = textOf({ ar: hit.snippet.ar, en: hit.snippet.en }, language);
                return (
                  <li key={hit.document.id} role="option" aria-selected={index === active}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => openHit(hit)}
                      className={`block w-full px-3 py-2.5 text-start transition ${
                        index === active ? 'bg-[#161c3a]' : 'hover:bg-[#121733]'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-amber-300">
                        <KindIcon kind={hit.document.kind} />
                        {KIND_LABEL[hit.document.kind][language]}
                        <span className="font-mono text-[9px] text-slate-500 normal-case">{hit.document.id}</span>
                      </span>
                      <span className="mt-1 block text-xs font-black text-white">
                        {textOf(hit.document.title, language)}
                      </span>
                      {snippet && (
                        <span className="mt-0.5 line-clamp-2 block text-[11px] leading-5 text-slate-400">{snippet}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {onAskTutor && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onAskTutor(query.trim());
              }}
              className="flex w-full items-center justify-between gap-2 border-t border-[#212747] px-3 py-2 text-[11px] font-bold text-slate-300 hover:bg-[#121733] hover:text-amber-300"
            >
              <span>{isAr ? 'اسأل المستشار عن هذا الموضوع' : 'Ask the tutor about this'}</span>
              <CornerDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
