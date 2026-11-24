/**
 * Floating Translator Robot UI.
 *
 * A small robot button pinned to the corner of every page. Tapping it opens
 * a panel with every supported language (searchable), the visitor's detected
 * browser language as a one-tap suggestion, live progress, and a restore
 * button. The panel chrome stays in Arabic/English and is excluded from
 * translation (`data-translator-ui`) so it never translates itself.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bot,
  Check,
  Globe,
  MapPin,
  RotateCcw,
  Search,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react';
import { Language } from '../types';
import {
  SITE_LANGUAGES,
  detectBrowserLanguage,
  getLanguage,
  languageFromUrl,
} from '../i18n/languages';
import { translationRobot, useTranslationRobot } from '../i18n/translationStore';
import type { DetectedLocale } from '../i18n/geoLocale';
import { getCountryName } from '../i18n/countryMap';

const POPULAR = SITE_LANGUAGES.filter(l => l.popular);

export const TranslatorRobot: React.FC<{ source: Language }> = ({ source }) => {
  const state = useTranslationRobot(source);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const isAr = source === 'ar';
  const activeLanguage = getLanguage(state.target);
  const detectedLanguage = getLanguage(state.detected);
  const [geoDetected, setGeoDetected] = useState<DetectedLocale | null>(() => {
    try {
      return (window as unknown as Record<string, unknown>).__inscoDetectedLocale as DetectedLocale | null ?? null;
    } catch {
      return null;
    }
  });

  // First visit: remember the browser language as a suggestion, and honour
  // an explicit ?lang= / ?translate= link immediately.
  useEffect(() => {
    const fromUrl = languageFromUrl(window.location.search);
    const detected = fromUrl ?? detectBrowserLanguage();
    translationRobot.setDetected(detected);
    if (fromUrl && fromUrl !== source) {
      void translationRobot.enable(fromUrl);
    }
    // Run once on mount; `source` changes are handled by the store itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Geo-location: listen for the banner's detection (IP → country) and reflect it in the panel
  useEffect(() => {
    const onLocale = (event: Event) => {
      const detail = (event as CustomEvent<DetectedLocale>).detail;
      if (detail?.languageCode) {
        setGeoDetected(detail);
        // Keep the old browser-language suggestion in sync so the panel's top button always matches location
        translationRobot.setDetected(detail.languageCode);
      }
    };
    const onOpen = () => setOpen(true);
    // If the banner already detected before this mounted, pick it up
    try {
      const existing = (window as unknown as Record<string, unknown>).__inscoDetectedLocale as DetectedLocale | undefined;
      if (existing?.languageCode) {
        setGeoDetected(existing);
        translationRobot.setDetected(existing.languageCode);
      }
    } catch { /* ignore */ }
    window.addEventListener('insco:locale-detected', onLocale as EventListener);
    window.addEventListener('insco:open-translator', onOpen);
    return () => {
      window.removeEventListener('insco:locale-detected', onLocale as EventListener);
      window.removeEventListener('insco:open-translator', onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SITE_LANGUAGES;
    return SITE_LANGUAGES.filter(
      l =>
        l.native.toLowerCase().includes(q) ||
        l.english.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q),
    );
  }, [query]);

  const progressPercent =
    state.progress.total > 0
      ? Math.round((state.progress.done / state.progress.total) * 100)
      : state.status === 'translating'
        ? 50
        : 100;

  const choose = (code: string) => {
    void translationRobot.enable(code);
  };

  return (
    <div data-translator-ui="true" data-no-translate="true">
      {/* Floating robot button */}
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={isAr ? 'مترجم إنسكو الذكي — ترجمة الموقع لجميع اللغات' : 'INSCO Translator Robot — translate this site into any language'}
        className="fixed bottom-4 z-[80] flex items-center gap-2 rounded-full border border-sky-400/40 bg-slate-900/95 py-2.5 pe-4 ps-3 text-sm font-bold text-white shadow-2xl shadow-black/50 backdrop-blur transition hover:bg-slate-800 cursor-pointer"
        style={{ insetInlineEnd: '1rem' }}
      >
        <span className="relative flex items-center justify-center">
          <Bot className="h-5 w-5 text-sky-300" aria-hidden="true" />
          {state.status === 'translating' && (
            <span className="absolute -inset-1.5 animate-ping rounded-full bg-sky-400/30" aria-hidden="true" />
          )}
          {state.target && state.status !== 'translating' && (
            <span className="absolute -end-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-400 px-1 text-[9px] font-black text-slate-950" aria-hidden="true">
              {state.target.slice(0, 2).toUpperCase()}
            </span>
          )}
        </span>
        <span>{isAr ? 'ترجمة' : 'Translate'}</span>
        {activeLanguage && (
          <span className="rounded-full bg-sky-400/20 px-2 py-0.5 text-[11px] font-semibold text-sky-200">
            {activeLanguage.native}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label={isAr ? 'لوحة مترجم إنسكو الذكي' : 'INSCO Translator Robot panel'}
          className="fixed bottom-20 z-[80] flex max-h-[72vh] w-[min(92vw,380px)] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/98 shadow-2xl shadow-black/60 backdrop-blur"
          style={{ insetInlineEnd: '1rem' }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
            <Bot className="h-5 w-5 shrink-0 text-sky-300" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-white">
                {isAr ? 'مترجم إنسكو الذكي' : 'INSCO Translator Robot'}
              </p>
              <p className="truncate text-[11px] text-slate-400">
                {isAr
                  ? 'ترجم الموقع كاملاً لأي لغة في العالم'
                  : 'Translate the whole site into any world language'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={isAr ? 'إغلاق' : 'Close'}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Geo-detected location (IP → country) — richer than browser-only */}
          {geoDetected && geoDetected.languageCode !== state.target && geoDetected.languageCode !== source && (
            <div className="mx-3 mt-3 rounded-xl border border-sky-400/30 bg-sky-400/10 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-200">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span aria-hidden="true">{geoDetected.flag}</span>
                <span>
                  {isAr
                    ? `موقعك: ${getCountryName(geoDetected.countryCode, 'ar')}${geoDetected.city ? ` — ${geoDetected.city}` : ''}`
                    : `Your location: ${getCountryName(geoDetected.countryCode, 'en')}${geoDetected.city ? ` — ${geoDetected.city}` : ''}`}
                </span>
                <span className="rounded-full bg-sky-400/20 px-1.5 py-0.5 text-[10px] font-bold text-sky-200">
                  {geoDetected.countryCode}
                </span>
                <span className="text-[10px] font-normal text-sky-300/80">
                  {geoDetected.method === 'ip' ? (isAr ? 'عبر الموقع' : 'via location') : isAr ? 'عبر المتصفح' : 'via browser'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => choose(geoDetected.languageCode)}
                className="mt-2 flex w-full items-center gap-2 rounded-lg bg-sky-400 px-3 py-2 text-start text-xs font-bold text-slate-950 transition hover:bg-sky-300 cursor-pointer"
              >
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">
                  {(() => {
                    const gl = getLanguage(geoDetected.languageCode);
                    return isAr
                      ? `ترجمة إلى ${gl?.native ?? geoDetected.languageCode}${gl ? ` (${gl.english})` : ''}`
                      : `Translate to ${gl?.native ?? geoDetected.languageCode}${gl ? ` (${gl.english})` : ''}`;
                  })()}
                </span>
              </button>
              <p className="pt-1.5 text-[10px] leading-relaxed text-sky-200/70">
                {isAr ? 'الترجمة تلقائية حسب موقع دخولك — تغيير اللغة اختياري دائماً.' : 'Auto-detected from your entry location — changing the language is always optional.'}
              </p>
            </div>
          )}

          {/* Fallback: browser-language suggestion when geo hasn't resolved yet */}
          {!geoDetected && detectedLanguage && detectedLanguage.code !== state.target && detectedLanguage.code !== source && (
            <button
              type="button"
              onClick={() => choose(detectedLanguage.code)}
              className="mx-3 mt-3 flex items-center gap-2 rounded-xl border border-amber-400/40 bg-amber-400/10 px-3 py-2 text-start text-xs text-amber-200 transition hover:bg-amber-400/20 cursor-pointer"
            >
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {isAr ? 'اكتشفنا لغة متصفحك: ' : 'We detected your browser language: '}
                <strong>{detectedLanguage.native} ({detectedLanguage.english})</strong>
                {' — '}
                {isAr ? 'اضغط للترجمة فوراً' : 'tap to translate now'}
              </span>
            </button>
          )}

          {/* Search */}
          <div className="px-3 pt-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={event => setQuery(event.target.value)}
                placeholder={isAr ? 'ابحث عن لغة… (مثال: Français)' : 'Search a language… (e.g. Français)'}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pe-3 ps-9 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
              />
            </label>
          </div>

          {/* Status */}
          {state.status === 'translating' && (
            <div className="px-4 pt-3" role="status" aria-live="polite">
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-sky-400 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="pt-1.5 text-[11px] text-slate-400">
                {isAr ? 'جارٍ الترجمة…' : 'Translating…'} {state.progress.done}/{state.progress.total}
              </p>
            </div>
          )}
          {state.status === 'error' && (
            <div className="mx-3 mt-3 flex items-start gap-2 rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-xs text-red-200" role="alert">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">{state.error}</span>
              <button
                type="button"
                onClick={() => void translationRobot.retry()}
                className="shrink-0 rounded-lg bg-red-400/20 px-2 py-1 font-bold transition hover:bg-red-400/30 cursor-pointer"
              >
                {isAr ? 'إعادة' : 'Retry'}
              </button>
            </div>
          )}

          {/* Language list */}
          <div className="mt-3 flex-1 overflow-y-auto px-3 pb-3">
            {/* Native / restore */}
            <button
              type="button"
              onClick={() => translationRobot.disable()}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-start text-sm transition cursor-pointer ${
                !state.target
                  ? 'bg-sky-400/15 font-bold text-sky-200'
                  : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Globe className="h-4 w-4 shrink-0 text-sky-300" aria-hidden="true" />
              <span className="flex-1">{isAr ? 'اللغة الأصلية (العربية)' : 'Original language (Arabic)'}</span>
              {!state.target && <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />}
            </button>

            {!query && (
              <>
                <p className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {isAr ? 'الأكثر استخداماً' : 'Popular'}
                </p>
                <div className="flex flex-wrap gap-1.5 px-1">
                  {POPULAR.map(language => (
                    <button
                      key={language.code}
                      type="button"
                      onClick={() => choose(language.code)}
                      className={`rounded-full border px-2.5 py-1.5 text-xs transition cursor-pointer ${
                        state.target === language.code
                          ? 'border-sky-400 bg-sky-400/20 font-bold text-sky-200'
                          : 'border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-800'
                      }`}
                    >
                      {language.native}
                    </button>
                  ))}
                </div>
                <p className="px-3 pb-1 pt-4 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  {isAr ? 'كل لغات العالم' : 'All world languages'}
                </p>
              </>
            )}

            <ul className="divide-y divide-slate-800/60">
              {filtered.map(language => (
                <li key={language.code}>
                  <button
                    type="button"
                    onClick={() => choose(language.code)}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition cursor-pointer ${
                      state.target === language.code
                        ? 'bg-sky-400/15 font-bold text-sky-200'
                        : 'text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex-1">
                      <span className="block">{language.native}</span>
                      <span className="block text-[11px] text-slate-500">{language.english}</span>
                    </span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                      {language.code}
                    </span>
                    {state.target === language.code && (
                      <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
            {filtered.length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-slate-500">
                {isAr ? 'لا توجد لغة مطابقة لبحثك' : 'No language matches your search'}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-2 border-t border-slate-800 px-4 py-2.5">
            <p className="flex-1 text-[10px] leading-relaxed text-slate-500">
              {isAr
                ? 'ترجمة آلية فورية (MyMemory + Google) — قد تختلف المصطلحات التقنية قليلاً.'
                : 'Instant machine translation (MyMemory + Google) — technical terms may vary slightly.'}
            </p>
            {state.target && (
              <button
                type="button"
                onClick={() => translationRobot.disable()}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-700 px-2 py-1.5 text-[11px] font-bold text-slate-200 transition hover:bg-slate-800 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                {isAr ? 'استعادة' : 'Restore'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
