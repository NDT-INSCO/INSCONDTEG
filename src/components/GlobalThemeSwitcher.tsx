import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Language } from '../types';
import { useTheme } from '../utils/themeStore';

interface GlobalThemeSwitcherProps {
  language: Language;
}

export const GlobalThemeSwitcher: React.FC<GlobalThemeSwitcherProps> = ({ language }) => {
  const { theme, isLight, toggleTheme } = useTheme();
  const isAr = language === 'ar';

  const actionLabel = isLight
    ? isAr
      ? 'التبديل إلى الوضع الداكن'
      : 'Switch to Dark mode'
    : isAr
      ? 'التبديل إلى الوضع الفاتح'
      : 'Switch to Light mode';

  const currentModeBadge = isLight
    ? isAr
      ? 'فاتح'
      : 'Light'
    : isAr
      ? 'داكن'
      : 'Dark';

  return (
    <button
      type="button"
      data-testid="global-theme-toggle"
      data-current-theme={theme}
      aria-label={actionLabel}
      aria-pressed={isLight}
      title={actionLabel}
      onClick={toggleTheme}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
        isLight
          ? 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 hover:border-cyan-600/50 shadow-2xs'
          : 'border-slate-700 bg-slate-900/70 text-slate-200 hover:bg-slate-800 hover:border-cyan-500/40'
      }`}
    >
      {isLight ? (
        <Sun className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
      ) : (
        <Moon className="w-3.5 h-3.5 text-cyan-400 shrink-0" aria-hidden="true" />
      )}
      <span className="hidden sm:inline">{currentModeBadge}</span>
    </button>
  );
};
