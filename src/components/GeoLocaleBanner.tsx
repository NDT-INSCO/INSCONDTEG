/**
 * Geo-aware auto-translation banner.
 *
 * On every first visit the banner silently detects the visitor's country
 * (IP → country → language, with browser/timezone fallbacks) and, when the
 * visitor has never chosen a language before, automatically opens the site
 * in their language:
 *   - ar / en → flips the native site toggle (perfect translation)
 *   - any other world language → asks the Translator Robot to machine-translate
 *
 * After an auto-translation a small dismissible banner confirms what happened
 * and offers to restore the original language. Any manual language change
 * (robot panel or the header toggle) marks the preference as manual for
 * 30 days and suppresses future auto-runs; dismissing the banner suppresses
 * it for 7 days. Changing the language is always optional.
 */

import React, { useEffect, useState } from 'react';
import { Globe, MapPin, RotateCcw, Settings2, Sparkles, X } from 'lucide-react';
import { Language } from '../types';
import { getLanguage } from '../i18n/languages';
import {
  autoDetectAndTranslate,
  clearDismissed,
  DetectedLocale,
  detectLocale,
  isDismissedActive,
  isManualOverrideActive,
  markDismissed,
  markManualOverride,
  readAutoApplied,
} from '../i18n/geoLocale';
import { getCountryName } from '../i18n/countryMap';
import { translationRobot } from '../i18n/translationStore';

interface Props {
  source: Language;
  onSwitchNativeLanguage: (next: Language) => void;
}

export const GeoLocaleBanner: React.FC<Props> = ({ source, onSwitchNativeLanguage }) => {
  const [detected, setDetected] = useState<DetectedLocale | null>(null);
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<'detecting' | 'auto' | 'suggestion'>('detecting');
  const originalSourceRef = React.useRef<Language>(source);

  // Run detection once on mount
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    // If there's already an explicit URL lang, don't run geo at all
    const urlLang = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('lang') ?? new URLSearchParams(window.location.search).get('translate') : null;
    // Also if visitor already has a robot target, don't auto — but still resolve detected for display
    const existingTarget = translationRobot.getTarget();

    const run = async () => {
      // Quick background detect for display in robot panel (no IP wait for suggestion)
      // But for auto we need full IP resolution
      const hasManual = isManualOverrideActive();
      const hasDismissed = isDismissedActive();

      // If user explicitly has a saved robot language, just detect for display, don't auto
      if (existingTarget) {
        const locale = await detectLocale(controller.signal);
        if (!cancelled && locale) {
          setDetected(locale);
          // Don't show banner when user already chose a language
        }
        return;
      }

      // URL override already handled by TranslatorRobot — don't auto here
      if (urlLang) {
        const locale = await detectLocale(controller.signal);
        if (!cancelled && locale) setDetected(locale);
        return;
      }

      const onSwitch = (next: Language) => {
        markManualOverride();
        onSwitchNativeLanguage(next);
      };

      // Remember the source before any auto-switch so restore can return correctly
      originalSourceRef.current = source;
      try {
        const locale = await autoDetectAndTranslate({
          source,
          onSwitchNativeLanguage: onSwitch,
          signal: controller.signal,
        });
        if (cancelled) return;
        if (locale) {
          setDetected(locale);
          const auto = readAutoApplied();
          // autoDetectAndTranslate only marks auto when it actually translated
          const didAuto = auto?.code === locale.languageCode;
          if (didAuto) {
            setPhase('auto');
            setVisible(true);
            // Auto-hide after 14s
            setTimeout(() => {
              if (!cancelled) setVisible(false);
            }, 14_000);
          } else if (!hasManual && !hasDismissed && locale.languageCode !== source) {
            // Didn't auto for some reason (manual/dismissed) but we have a useful suggestion
            // Don't nag — only show suggestion if confidence high and not dismissed
            // We intentionally keep this silent for now; robot panel shows the suggestion instead.
          }
        } else {
          // No auto, but still populate detected for robot panel
          const fallback = await detectLocale(controller.signal);
          if (!cancelled && fallback) setDetected(fallback);
        }
      } catch {
        // IP blocked / offline — still try to get browser locale for display
        try {
          const fallback = await detectLocale(controller.signal);
          if (!cancelled && fallback) setDetected(fallback);
        } catch { /* ignore */ }
      }
    };

    // Small delay so the page paints first (no FOUC from translation fighting mount)
    const timer = setTimeout(run, 900);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
    // Run only once on mount; source changes are handled by the robot itself
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expose detected locale to window for robot panel access (simple cross-component handoff)
  useEffect(() => {
    if (detected) {
      (window as unknown as Record<string, unknown>).__inscoDetectedLocale = detected;
      window.dispatchEvent(new CustomEvent('insco:locale-detected', { detail: detected }));
    }
  }, [detected]);

  if (!visible || !detected) return null;

  const isAr = source === 'ar';
  const lang = getLanguage(detected.languageCode);
  const flag = detected.flag;
  const countryAr = getCountryName(detected.countryCode, 'ar');
  const countryEn = getCountryName(detected.countryCode, 'en');

  const handleRestore = () => {
    markManualOverride();
    const original = originalSourceRef.current;
    // Native ar/en was auto-flipped: restore to what the visitor started with
    if ((detected.languageCode === 'ar' || detected.languageCode === 'en') && original !== source) {
      onSwitchNativeLanguage(original);
    } else if ((detected.languageCode === 'ar' || detected.languageCode === 'en') && detected.languageCode !== original) {
      // Edge: auto switched but source prop hasn't updated yet in this render
      onSwitchNativeLanguage(original);
    } else {
      translationRobot.disable({ manual: true });
    }
    setVisible(false);
    markDismissed();
  };

  const handleDismiss = () => {
    setVisible(false);
    markDismissed();
  };

  const handleOpenRobot = () => {
    // Let the robot panel open — dispatch event the robot can listen to
    window.dispatchEvent(new CustomEvent('insco:open-translator'));
    setVisible(false);
  };

  return (
    <div
      data-translator-ui="true"
      data-no-translate="true"
      className="fixed inset-x-0 top-0 z-[85] flex justify-center px-3 pt-3 pointer-events-none"
      aria-live="polite"
      role="status"
    >
      <div className="pointer-events-auto flex w-full max-w-[720px] items-start gap-3 rounded-2xl border border-sky-400/30 bg-slate-900/95 px-4 py-3 shadow-2xl shadow-black/50 backdrop-blur">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-400/15 text-lg">
          <span aria-hidden="true">{flag}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-white">
            <MapPin className="h-4 w-4 shrink-0 text-sky-300" aria-hidden="true" />
            <span>
              {isAr ? `اكتشفنا موقعك: ${countryAr}` : `Detected your location: ${countryEn}`}
            </span>
            {detected.city && (
              <span className="font-normal text-slate-300">
                {isAr ? `— ${detected.city}` : `— ${detected.city}`}
              </span>
            )}
            <span className="rounded-full bg-sky-400/20 px-2 py-0.5 text-[11px] font-bold text-sky-200">
              {detected.countryCode}
            </span>
          </p>
          <p className="pt-1 text-xs leading-relaxed text-slate-200">
            {phase === 'auto' ? (
              isAr ? (
                <>
                  تم فتح الموقع تلقائياً بالـ <strong className="text-white">{lang?.native ?? detected.languageCode}</strong>
                  {lang && <span className="text-slate-400"> ({lang.english})</span>}
                  <span className="text-slate-400"> — حسب موقع دخولك. </span>
                  تغيير اللغة اختياري دائماً.
                </>
              ) : (
                <>
                  The site was automatically opened in <strong className="text-white">{lang?.native ?? detected.languageCode}</strong>
                  {lang && <span className="text-slate-400"> ({lang.english})</span>}
                  <span className="text-slate-400"> based on your location. </span>
                  Changing the language is always optional.
                </>
              )
            ) : (
              isAr ? (
                <>هل تريد المتابعة بهذه اللغة؟ يمكنك تغييرها في أي وقت من زر الترجمة.</>
              ) : (
                <>Want to continue in this language? You can change it anytime from the translate button.</>
              )
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2.5">
            <button
              type="button"
              onClick={handleRestore}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-black text-slate-900 transition hover:bg-slate-100 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              {isAr ? 'العودة للعربية' : 'Restore original'}
            </button>
            <button
              type="button"
              onClick={handleOpenRobot}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-slate-800 cursor-pointer"
            >
              <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
              {isAr ? 'تغيير اللغة' : 'Change language'}
            </button>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <Globe className="h-3 w-3" aria-hidden="true" />
              {detected.method === 'ip' ? (isAr ? 'عبر الموقع الجغرافي' : 'via location') : isAr ? 'عبر المتصفح' : 'via browser'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label={isAr ? 'إغلاق' : 'Dismiss'}
          className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white cursor-pointer"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
