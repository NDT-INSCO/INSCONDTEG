import React, { useEffect, useRef, useState } from 'react';
import { Check, Ruler, Settings, X } from 'lucide-react';
import type { Language } from '../types';
import { useTheme } from '../utils/themeStore';
import { useDefaultUnitSystem, type GlobalUnitSystem } from '../utils/unitSystemStore';

interface GlobalAppConfigControlProps {
  language: Language;
}

export const GlobalAppConfigControl: React.FC<GlobalAppConfigControlProps> = ({ language }) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const { defaultUnitSystem, setDefaultUnitSystem } = useDefaultUnitSystem();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        if (containerRef.current?.contains(document.activeElement)) trigger.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSelectUnit = (next: GlobalUnitSystem) => {
    setDefaultUnitSystem(next);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        ref={trigger}
        data-testid="global-app-config-toggle"
        data-default-unit={defaultUnitSystem}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={isAr ? 'إعدادات التطبيق ونظام الوحدات الافتراضي' : 'App settings and default unit system'}
        title={isAr ? 'إعدادات التطبيق' : 'App Settings'}
        onClick={() => setOpen(prev => !prev)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer whitespace-nowrap shrink-0 ${
          isLight
            ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:border-cyan-600/50 shadow-2xs'
            : 'border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800 hover:border-cyan-500/40'
        }`}
      >
        <Settings className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline font-mono tabular-nums">
          {defaultUnitSystem === 'metric'
            ? isAr
              ? 'متري (mm)'
              : 'Metric'
            : isAr
              ? 'إمبريال (in)'
              : 'Imperial'}
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="false"
          data-testid="global-app-config-panel"
          aria-label={isAr ? 'إعدادات التطبيق' : 'App Configuration'}
          dir={isAr ? 'rtl' : 'ltr'}
          className={`fixed inset-x-4 top-full mt-2 max-h-[65dvh] overflow-y-auto rounded-xl border p-4 shadow-2xl z-[80] space-y-3 sm:absolute sm:inset-s-auto sm:inset-e-0 sm:w-80 ${
            isLight
              ? 'border-slate-200 bg-white text-slate-900'
              : 'border-slate-700 bg-slate-950 text-slate-100'
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-800/40 pb-2.5">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
              <span className="text-xs font-black">
                {isAr ? 'إعدادات التطبيق العامة' : 'App Configuration'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => { setOpen(false); trigger.current?.focus(); }}
              aria-label={isAr ? 'إغلاق الإعدادات' : 'Close settings'}
              className="rounded-lg p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="space-y-0.5">
              <div className="text-xs font-bold">
                {isAr ? 'نظام الوحدات الافتراضي' : 'Default Unit System'}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isAr
                  ? 'يُحفظ تلقائياً ويُضبط كاختيار افتراضي لجميع الحاسبات الهندسية.'
                  : 'Persists in local storage and defaults all engineering calculators to this system.'}
              </p>
            </div>

            <div
              role="radiogroup"
              aria-label={isAr ? 'اختر نظام الوحدات الافتراضي' : 'Choose default unit system'}
              className="grid grid-cols-2 gap-2"
            >
              <button
                type="button"
                role="radio"
                data-testid="global-default-unit-metric"
                aria-checked={defaultUnitSystem === 'metric'}
                onClick={() => handleSelectUnit('metric')}
                className={`rounded-lg border px-3 py-2 text-start transition cursor-pointer ${
                  defaultUnitSystem === 'metric'
                    ? isLight
                      ? 'border-sky-600 bg-sky-50 text-sky-900'
                      : 'border-sky-500 bg-sky-500/15 text-sky-300'
                    : isLight
                      ? 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-xs font-bold">
                  <span>{isAr ? 'متري' : 'Metric'}</span>
                  {defaultUnitSystem === 'metric' && (
                    <Check
                      className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-sky-700' : 'text-sky-400'}`}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  mm / cm / °C
                </div>
              </button>

              <button
                type="button"
                role="radio"
                data-testid="global-default-unit-imperial"
                aria-checked={defaultUnitSystem === 'imperial'}
                onClick={() => handleSelectUnit('imperial')}
                className={`rounded-lg border px-3 py-2 text-start transition cursor-pointer ${
                  defaultUnitSystem === 'imperial'
                    ? isLight
                      ? 'border-amber-600 bg-amber-50 text-amber-900'
                      : 'border-amber-500 bg-amber-500/15 text-amber-300'
                    : isLight
                      ? 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 text-xs font-bold">
                  <span>{isAr ? 'إمبريال' : 'Imperial'}</span>
                  {defaultUnitSystem === 'imperial' && (
                    <Check
                      className={`w-3.5 h-3.5 shrink-0 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className={`text-[10px] font-mono mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  in / ft / °F
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
