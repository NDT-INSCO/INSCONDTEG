import { ADMIN_HASH, ANNOUNCEMENT_API } from './contract';
import type { LocalizedText } from '../types';
import { isStaticPages } from '../utils/staticPages';

const INSCO_PAGES_ORIGIN = 'https://ndt-insco.github.io';
const INSCO_PAGES_PATH = '/INSCONDTEG';
export const OFFICIAL_PAGES_ADMIN_URL = 'https://inscondteg.vercel.app/';

/** Validate an explicit HTTPS admin host, never another static Pages site or this origin. */
export function externalAdminLink(
  raw = import.meta.env?.VITE_ADMIN_PORTAL_URL,
  siteOrigin = typeof window === 'undefined' ? undefined : window.location.origin,
): string | null {
  if (!raw?.trim()) return null;
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.search
      || url.origin === siteOrigin || /(^|\.)github\.io\.?$/.test(url.hostname)) return null;
    url.hash = ADMIN_HASH;
    return url.href;
  } catch {
    return null;
  }
}

/** Resolve a navigation link. Only the official Pages site gets the built-in destination. */
export function adminPortalLink(
  raw = import.meta.env?.VITE_ADMIN_PORTAL_URL,
  site: Pick<Location, 'origin' | 'pathname'> | undefined = typeof window === 'undefined' ? undefined : window.location,
): string | null {
  if (raw?.trim()) return externalAdminLink(raw, site?.origin);
  if (site?.origin !== INSCO_PAGES_ORIGIN ||
    (site.pathname !== INSCO_PAGES_PATH && !site.pathname.startsWith(`${INSCO_PAGES_PATH}/`))) return null;
  return externalAdminLink(OFFICIAL_PAGES_ADMIN_URL, site.origin);
}

export async function readPublicAnnouncement(signal: AbortSignal): Promise<LocalizedText | null> {
  const portal = externalAdminLink();
  // The built-in navigation link does not opt the public site into cross-origin API calls.
  if (!portal && isStaticPages()) return null;
  const endpoint = portal ? new URL(ANNOUNCEMENT_API, portal).href : ANNOUNCEMENT_API;
  try {
    const response = await fetch(endpoint, { signal, cache: 'no-store', credentials: 'omit' });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null;
    const { message } = await response.json();
    return typeof message?.ar === 'string' && typeof message?.en === 'string' ? message : null;
  } catch {
    // An optional banner must never break the public page.
    return null;
  }
}
