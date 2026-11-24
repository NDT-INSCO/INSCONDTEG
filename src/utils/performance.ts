/**
 * Performance utilities for INSCO —
 * translation batching, lazy loading, and vitals.
 */

// Debounce utility for search inputs
export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return ((...args: unknown[]) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...(args as Parameters<T>)), ms);
  }) as T;
}

// Throttle scroll/resize handlers
export function throttle<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let last = 0;
  return ((...args: unknown[]) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...(args as Parameters<T>));
    }
  }) as T;
}

// Lazy load helper — dynamic import with retry
export async function lazyImport<T>(importer: () => Promise<T>, retries = 2): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try {
      return await importer();
    } catch (e) {
      if (i === retries) throw e;
      await new Promise(r => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw new Error('lazyImport failed');
}

// Web Vitals reporting (CLS, LCP, INP)
export function reportWebVitals(onReport?: (metric: { name: string; value: number }) => void): void {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    // Largest Contentful Paint
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        const val = (entry as PerformanceEntry & { startTime: number }).startTime;
        onReport?.({ name: 'LCP', value: Math.round(val) });
        try { if ((import.meta as unknown as { env?: { DEV?: boolean } })?.env?.DEV) console.log('[perf] LCP', Math.round(val)); } catch { /* ignore */ }
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // Layout Shift (CLS)
    let cls = 0;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries() as unknown as Array<{ value: number; hadRecentInput: boolean }>) {
        if (!entry.hadRecentInput) cls += entry.value;
      }
      onReport?.({ name: 'CLS', value: Math.round(cls * 1000) / 1000 });
    }).observe({ type: 'layout-shift', buffered: true });
  } catch {
    // PerformanceObserver not supported for these types
  }
}

// Prefetch a chunk on idle (for popular language translations)
export function prefetchOnIdle(urls: string[]): void {
  const run = () => {
    for (const url of urls) {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    }
  };
  if ('requestIdleCallback' in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(run);
  } else {
    setTimeout(run, 2000);
  }
}

// Check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Cache size helper — estimate localStorage usage
export function estimateCacheSize(): { used: number; quota: number } {
  let used = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const val = localStorage.getItem(key) || '';
        used += key.length + val.length;
      }
    }
  } catch {
    // ignore
  }
  // Most browsers allow ~5MB for localStorage
  return { used: Math.round(used / 1024), quota: 5120 };
}
