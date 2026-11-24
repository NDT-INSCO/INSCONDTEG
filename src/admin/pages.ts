import { INSCO_PAGES_ORIGIN, INSCO_PAGES_PATH } from './contract.js';

// Public production address only. Set this after the new backend passes its
// signed-out and authenticated smoke tests; the committed docs/ build uses it.
export const INSCO_PAGES_ADMIN_API_URL = '';

export function isInscoPages(site: Pick<Location, 'origin' | 'pathname'> | undefined): boolean {
  return site?.origin === INSCO_PAGES_ORIGIN
    && (site.pathname === INSCO_PAGES_PATH || site.pathname.startsWith(`${INSCO_PAGES_PATH}/`));
}

/** Never aim the Pages password form at a Pages, Vercel, preview, or non-HTTPS URL. */
export function approvedPagesAdminOrigin(raw?: string): string | null {
  try {
    const url = new URL(raw?.trim() ?? '');
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash
      || !/^[a-z\d-]+(?:\.[a-z\d-]+)+$/i.test(url.hostname) || /^[\d.]+$/.test(url.hostname)
      || /(^|\.)(github\.io|vercel\.app)$/i.test(url.hostname)
      || (url.hostname.endsWith('.netlify.app') && url.hostname.split('.')[0].includes('--'))) return null;
    return url.origin;
  } catch { return null; }
}

export function pagesAdminOrigin(
  raw = import.meta.env?.VITE_PAGES_ADMIN_API_URL ?? INSCO_PAGES_ADMIN_API_URL,
  site: Pick<Location, 'origin' | 'pathname'> | undefined = typeof window === 'undefined' ? undefined : window.location,
  externalOverride = import.meta.env?.VITE_ADMIN_PORTAL_URL,
): string | null {
  if (!isInscoPages(site) || externalOverride?.trim()) return null;
  return approvedPagesAdminOrigin(raw);
}
