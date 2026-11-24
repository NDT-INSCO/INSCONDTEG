/**
 * HeaderLanguageSelector — persistent, accessible language switcher
 * shown in the site header (replaces the simple ar/en toggle).
 *
 * Features:
 * - Popular languages as quick pills
 * - Search across 110+ languages
 * - Shows current language with flag
 * - Persists choice, respects geo-auto, marks manual override
 * - Fully keyboard accessible (Arrow keys, Escape, Enter)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Globe, Languages, Search, X } from 'lucide-react';
import { Language } from '../types';
import { SITE_LANGUAGES, getLanguage } from '../i18n/languages';
import { getLanguageForCountry, countryToFlag } from '../i18n/countryMap';
import { translationRobot, useTranslationRobot } from '../i18n/translationStore';
import { getDetectedLocaleForDisplay } from '../i18n/geoLocale';

const POPULAR = SITE_LANGUAGES.filter(l => l.popular);

interface Props {
  source: Language;
  onSwitchNativeLanguage: (next: Language) => void;
}

export const HeaderLanguageSelector: React.FC<Props> = ({ source, onSwitchNativeLanguage }) => {
  const state = useTranslationRobot(source);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const isAr = source === 'ar';
  const activeLang = getLanguage(state.target || source) || getLanguage(source) || { native: source === 'ar' ? 'العربية' : 'English', english: source === 'ar' ? 'Arabic' : 'English', code: source, dir: source === 'ar' ? 'rtl' : 'ltr' } as unknown as ReturnType<typeof getLanguage>;

  // Try to get detected country for flag display
  const detectedCountry = useMemo(() => {
    try {
      const detected = getDetectedLocaleForDisplay();
      return detected?.countryCode || null;
    } catch {
      return null;
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SITE_LANGUAGES;
    return SITE_LANGUAGES.filter(
      l => l.native.toLowerCase().includes(q) || l.english.toLowerCase().includes(q) || l.code.toLowerCase().includes(q)
    );
  }, [query]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus(); }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const choose = (code: string) => {
    if (code === 'ar' || code === 'en') {
      // Native switch
      if (state.target) translationRobot.disable({ manual: true });
      onSwitchNativeLanguage(code as Language);
    } else {
      // Robot translation
      void translationRobot.enable(code, { manual: true });
    }
    setOpen(false);
  };

  const isActive = (code: string) => state.target === code || (!state.target && source === code);

  return (
    <div className="relative" data-translator-ui="true">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={isAr ? `اللغة الحالية: ${activeLang!.native}` : `Current language: ${activeLang!.native}`}
        className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition cursor-pointer"
      >
        <Globe className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">{detectedCountry ? countryToFlag(detectedCountry) : ''}</span>
        <span className="max-w-[80px] truncate">{activeLang!.native}</span>
        <Languages className="w-3 h-3 opacity-60" aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label={isAr ? 'اختيار اللغة' : 'Choose language'}
          className="absolute z-[90] mt-2 w-[min(92vw,380px)] max-h-[70vh] flex flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl"
          style={{ insetInlineEnd: 0 }}
        >
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
            <Languages className="w-4 h-4 text-sky-400" aria-hidden="true" />
            <p className="flex-1 text-sm font-bold text-white">{isAr ? 'اختر لغتك' : 'Choose your language'}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={isAr ? 'إغلاق' : 'Close'}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute start-3 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={isAr ? 'ابحث عن لغة…' : 'Search languages…'}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 ps-9 pe-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                aria-label={isAr ? 'ابحث عن لغة' : 'Search languages'}
              />
            </label>
          </div>

          <div className="flex-1 overflow-y-auto px-3 pb-3">
            {!query && (
              <>
                <p className="px-2 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">{isAr ? 'الأكثر استخداماً' : 'Popular'}</p>
                <div className="flex flex-wrap gap-1.5 px-1 pb-3">
                  {POPULAR.map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => choose(lang.code)}
                      aria-pressed={isActive(lang.code)}
                      className={`rounded-full border px-2.5 py-1.5 text-xs transition cursor-pointer ${isActive(lang.code) ? 'border-sky-400 bg-sky-400/20 font-bold text-sky-200' : 'border-slate-700 text-slate-200 hover:bg-slate-800'}`}
                    >
                      {lang.native}
                    </button>
                  ))}
                </div>
              </>
            )}

            <ul className="divide-y divide-slate-800/60" role="listbox" aria-label={isAr ? 'كل اللغات' : 'All languages'}>
              {filtered.map(lang => (
                <li key={lang.code} role="option" aria-selected={isActive(lang.code)}>
                  <button
                    type="button"
                    onClick={() => choose(lang.code)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition ${isActive(lang.code) ? 'bg-sky-400/15 font-bold text-sky-200' : 'text-slate-200 hover:bg-slate-800'}`}
                  >
                    <span className="flex-1">
                      <span className="block">{lang.native}</span>
                      <span className="block text-[11px] text-slate-500">{lang.english}</span>
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-400">{lang.code}</span>
                    {isActive(lang.code) && <Check className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-slate-800 px-4 py-2 text-[10px] text-slate-500">
            {isAr ? 'التغيير يُحفظ تلقائياً — يمكنك تغييره في أي وقت.' : 'Your choice is saved automatically — you can change it anytime.'}
          </div>
        </div>
      )}
    </div>
  );
};
