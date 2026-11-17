import { useCallback, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'insco_theme_v1';
export const THEME_CHANGE_EVENT = 'insco_theme_updated';

function normalizeTheme(raw: string | null | undefined): ThemeMode {
  if (!raw) return 'dark';
  const cleaned = raw.trim().toLowerCase();
  return cleaned === 'light' ? 'light' : 'dark';
}

export function readTheme(): ThemeMode {
  try {
    return normalizeTheme(localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return 'dark';
  }
}

export function applyThemeToDocument(theme: ThemeMode): void {
  if (typeof document === 'undefined' || !document.documentElement) return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  if (theme === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }
}

export function setTheme(nextTheme: ThemeMode): ThemeMode {
  const normalized: ThemeMode = nextTheme === 'light' ? 'light' : 'dark';
  try {
    localStorage.setItem(THEME_STORAGE_KEY, normalized);
  } catch {
    /* private browsing or restricted storage: theme still applies for current session */
  }
  applyThemeToDocument(normalized);

  if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(new CustomEvent<ThemeMode>(THEME_CHANGE_EVENT, { detail: normalized }));
  }

  return normalized;
}

export function toggleTheme(): ThemeMode {
  const current = readTheme();
  return setTheme(current === 'dark' ? 'light' : 'dark');
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(readTheme);

  useEffect(() => {
    // Re-read storage on mount in case tests or external scripts mutated localStorage prior to render
    const initial = readTheme();
    if (initial !== theme) {
      setThemeState(initial);
    }
    applyThemeToDocument(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCustomChange = (event: Event) => {
      const custom = event as CustomEvent<ThemeMode>;
      const next = custom.detail ? normalizeTheme(custom.detail) : readTheme();
      setThemeState(next);
      applyThemeToDocument(next);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === null || event.key === THEME_STORAGE_KEY) {
        const next = readTheme();
        setThemeState(next);
        applyThemeToDocument(next);
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleCustomChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateTheme = useCallback((next: ThemeMode) => {
    const applied = setTheme(next);
    setThemeState(applied);
    return applied;
  }, []);

  const flipTheme = useCallback(() => {
    const next: ThemeMode = readTheme() === 'dark' ? 'light' : 'dark';
    const applied = setTheme(next);
    setThemeState(applied);
    return applied;
  }, []);

  return {
    theme,
    isLight: theme === 'light',
    isDark: theme === 'dark',
    setTheme: updateTheme,
    toggleTheme: flipTheme,
  };
}
