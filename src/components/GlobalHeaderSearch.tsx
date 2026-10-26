import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  X,
  Wrench,
  GraduationCap,
  Building2,
  ArrowUpLeft,
  ArrowUpRight,
} from 'lucide-react';
import type { Language } from '../types';
import type { SubTab } from './EducationalAcademy';
import {
  filterGlobalSearchItems,
  type GlobalSearchCategory,
  type GlobalSearchItem,
} from '../utils/globalSearchIndex';

interface GlobalHeaderSearchProps {
  language: Language;
  onNavigateToCompany: (sectionId?: string) => void;
  onNavigateToAcademy: (subTab?: SubTab) => void;
}

export const GlobalHeaderSearch: React.FC<GlobalHeaderSearchProps> = ({
  language,
  onNavigateToCompany,
  onNavigateToAcademy,
}) => {
  const isAr = language === 'ar';
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | GlobalSearchCategory>('all');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(
    () => filterGlobalSearchItems(query, categoryFilter, 10),
    [query, categoryFilter]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, categoryFilter]);

  // Dismiss dropdown when clicking outside
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  // Optional '/' or Ctrl/Cmd+K shortcut to focus global header search when not typing in another field
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        return;
      }

      if (!isEditable && event.key === '/') {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const handleSelectResult = (item: GlobalSearchItem) => {
    if (item.destination.type === 'academy') {
      onNavigateToAcademy(item.destination.subTab);
    } else {
      onNavigateToCompany(item.destination.sectionId);
    }
    setIsOpen(false);
    setQuery('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'Enter')) {
      setIsOpen(true);
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (results.length > 0) {
        setActiveIndex((prev) => (prev + 1) % results.length);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length > 0) {
        setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
      }
    } else if (event.key === 'Enter' && results.length > 0) {
      event.preventDefault();
      const target = results[activeIndex] ?? results[0];
      if (target) {
        handleSelectResult(target);
      }
    }
  };

  const getCategoryLabel = (cat: GlobalSearchCategory) => {
    if (cat === 'services') return isAr ? 'الخدمات والأسطول' : 'Services';
    if (cat === 'academy') return isAr ? 'وحدة تعليمية' : 'Academy Module';
    return isAr ? 'معلومات الشركة' : 'Company Info';
  };

  const getCategoryIcon = (cat: GlobalSearchCategory) => {
    if (cat === 'services') return <Wrench className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
    if (cat === 'academy') return <GraduationCap className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    return <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  };

  const filterTabs: { id: 'all' | GlobalSearchCategory; label: string }[] = [
    { id: 'all', label: isAr ? 'الكل' : 'All' },
    { id: 'services', label: isAr ? 'الخدمات' : 'Services' },
    { id: 'academy', label: isAr ? 'التعليم' : 'Modules' },
    { id: 'company', label: isAr ? 'الشركة' : 'Company' },
  ];

  const JumpIcon = isAr ? ArrowUpLeft : ArrowUpRight;

  return (
    <div ref={containerRef} role="search" className="relative w-full xl:w-52 2xl:w-64">
      <div className="relative flex items-center">
        <Search
          aria-hidden="true"
          className={`w-3.5 h-3.5 text-slate-400 pointer-events-none absolute ${
            isAr ? 'right-2.5' : 'left-2.5'
          }`}
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          aria-label={
            isAr
              ? 'بحث شامل في الخدمات والوحدات التعليمية ومعلومات الشركة'
              : 'Global search for services, educational modules, and company info'
          }
          aria-expanded={isOpen}
          aria-controls="global-header-search-results"
          placeholder={
            isAr
              ? 'ابحث: خدمات، محاكيات، ISO...'
              : 'Search services, modules, ISO...'
          }
          className={`w-full rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 focus:border-cyan-500 focus:outline-none py-1.5 text-xs text-slate-100 placeholder:text-slate-500 transition ${
            isAr ? 'pr-8 pl-7' : 'pl-8 pr-7'
          }`}
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            aria-label={isAr ? 'مسح البحث' : 'Clear search'}
            className={`absolute ${
              isAr ? 'left-2' : 'right-2'
            } text-slate-400 hover:text-slate-200 transition cursor-pointer`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd
            aria-hidden="true"
            className={`hidden sm:inline-block absolute ${
              isAr ? 'left-2' : 'right-2'
            } text-[10px] font-mono text-slate-500 select-none pointer-events-none`}
          >
            /
          </kbd>
        )}
      </div>

      {isOpen && (
        <div
          id="global-header-search-results"
          className={`absolute top-full mt-2 w-full sm:w-[400px] ${
            isAr ? 'left-0 sm:right-0 sm:left-auto' : 'left-0 sm:right-0 sm:left-auto'
          } rounded-xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/70 z-50 overflow-hidden`}
        >
          {/* Category Filter Strip */}
          <div className="flex items-center justify-between gap-1 px-3 py-2 border-b border-slate-800/90 bg-slate-900/60">
            <div className="flex items-center gap-1">
              {filterTabs.map((tab) => {
                const active = categoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`px-2 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-cyan-600 text-white'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">
              {query.trim()
                ? isAr
                  ? `${results.length} نتيجة`
                  : `${results.length} found`
                : isAr
                ? 'وصول سريع'
                : 'Quick jump'}
            </span>
          </div>

          {/* Filtered Results List */}
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-slate-400">
              {isAr
                ? `لا توجد نتائج مطابقة لـ "${query}". جرّب البحث عن PAUT أو PWHT أو DAC أو ISO.`
                : `No matches found for "${query}". Try searching PAUT, PWHT, DAC, or ISO.`}
            </div>
          ) : (
            <ul role="listbox" className="max-h-80 overflow-y-auto divide-y divide-slate-800/70">
              {results.map((item, idx) => {
                const isSelected = idx === activeIndex;
                return (
                  <li key={item.id} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => handleSelectResult(item)}
                      className={`w-full px-3.5 py-2.5 text-start flex items-start gap-2.5 transition cursor-pointer ${
                        isSelected ? 'bg-slate-900' : 'hover:bg-slate-900/60'
                      }`}
                    >
                      <div className="mt-0.5">{getCategoryIcon(item.category)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 truncate">
                          <span className="text-cyan-400">{getCategoryLabel(item.category)}</span>
                          {item.code && (
                            <>
                              <span aria-hidden="true" className="text-slate-600">
                                ·
                              </span>
                              <span>{item.code}</span>
                            </>
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-100 leading-snug mt-0.5 line-clamp-1">
                          {item.title[language]}
                        </div>
                        <div className="text-[11px] text-slate-400 leading-snug mt-0.5 line-clamp-1">
                          {item.subtitle[language]}
                        </div>
                      </div>
                      <JumpIcon className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-1" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
