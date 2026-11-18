import { useCallback, useEffect, useState } from 'react';

export type GlobalUnitSystem = 'metric' | 'imperial';

export const DEFAULT_UNIT_SYSTEM_STORAGE_KEY = 'insco_default_unit_system_v1';
export const DEFAULT_UNIT_SYSTEM_CHANGE_EVENT = 'insco_default_unit_system_updated';
export const GE_APP_UNIT_OVERRIDE_KEY = 'ge_app_unit_system';

export function normalizeUnitSystem(raw: string | null | undefined): GlobalUnitSystem {
  if (!raw) return 'metric';
  const cleaned = raw.trim().toLowerCase();
  return cleaned === 'imperial' ? 'imperial' : 'metric';
}

export function readDefaultUnitSystem(): GlobalUnitSystem {
  try {
    if (typeof localStorage !== 'undefined') {
      return normalizeUnitSystem(localStorage.getItem(DEFAULT_UNIT_SYSTEM_STORAGE_KEY));
    }
  } catch {
    // ignore in restricted storage contexts
  }
  return 'metric';
}

export function applyUnitSystemToDocument(unitSystem: GlobalUnitSystem): void {
  if (typeof document === 'undefined' || !document.documentElement) return;
  document.documentElement.dataset.unitSystem = unitSystem;
}

/**
 * Updates the global default unit system in localStorage, clears stale per-calculator
 * overrides so all calculators adopt the new default, and notifies mounted calculators.
 */
export function setDefaultUnitSystem(nextUnitSystem: GlobalUnitSystem): GlobalUnitSystem {
  const normalized: GlobalUnitSystem = nextUnitSystem === 'imperial' ? 'imperial' : 'metric';
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DEFAULT_UNIT_SYSTEM_STORAGE_KEY, normalized);
      localStorage.removeItem(GE_APP_UNIT_OVERRIDE_KEY);
    }
  } catch {
    // ignore in restricted storage contexts
  }
  applyUnitSystemToDocument(normalized);

  if (typeof window !== 'undefined' && typeof CustomEvent !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<GlobalUnitSystem>(DEFAULT_UNIT_SYSTEM_CHANGE_EVENT, { detail: normalized })
    );
  }

  return normalized;
}

export function toggleDefaultUnitSystem(): GlobalUnitSystem {
  const current = readDefaultUnitSystem();
  return setDefaultUnitSystem(current === 'metric' ? 'imperial' : 'metric');
}

export function resolveCalculatorInitialUnitSystem(overrideKey?: string): GlobalUnitSystem {
  if (overrideKey) {
    try {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(overrideKey);
        if (stored === 'metric' || stored === 'imperial') {
          return stored;
        }
      }
    } catch {
      // ignore
    }
  }
  return readDefaultUnitSystem();
}

export function useDefaultUnitSystem() {
  const [defaultUnitSystem, setUnitState] = useState<GlobalUnitSystem>(readDefaultUnitSystem);

  useEffect(() => {
    const initial = readDefaultUnitSystem();
    if (initial !== defaultUnitSystem) {
      setUnitState(initial);
    }
    applyUnitSystemToDocument(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyUnitSystemToDocument(defaultUnitSystem);
  }, [defaultUnitSystem]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCustomChange = (event: Event) => {
      const custom = event as CustomEvent<GlobalUnitSystem>;
      const next = custom.detail ? normalizeUnitSystem(custom.detail) : readDefaultUnitSystem();
      setUnitState(next);
      applyUnitSystemToDocument(next);
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === null || event.key === DEFAULT_UNIT_SYSTEM_STORAGE_KEY) {
        const next = readDefaultUnitSystem();
        setUnitState(next);
        applyUnitSystemToDocument(next);
      }
    };

    window.addEventListener(DEFAULT_UNIT_SYSTEM_CHANGE_EVENT, handleCustomChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(DEFAULT_UNIT_SYSTEM_CHANGE_EVENT, handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const updateDefaultUnitSystem = useCallback((next: GlobalUnitSystem) => {
    const applied = setDefaultUnitSystem(next);
    setUnitState(applied);
    return applied;
  }, []);

  const flipDefaultUnitSystem = useCallback(() => {
    const next: GlobalUnitSystem = readDefaultUnitSystem() === 'metric' ? 'imperial' : 'metric';
    const applied = setDefaultUnitSystem(next);
    setUnitState(applied);
    return applied;
  }, []);

  return {
    defaultUnitSystem,
    isMetric: defaultUnitSystem === 'metric',
    isImperial: defaultUnitSystem === 'imperial',
    setDefaultUnitSystem: updateDefaultUnitSystem,
    toggleDefaultUnitSystem: flipDefaultUnitSystem,
  };
}
