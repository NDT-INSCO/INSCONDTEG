import { ADMIN_HASH, ANNOUNCEMENT_API } from './contract';
import type { LocalizedText } from '../types';
import { isStaticPages } from '../utils/staticPages';

/** Send staff to the configured HTTPS admin host, never to another static Pages site or back here. */
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

export async function readPublicAnnouncement(signal: AbortSignal): Promise<LocalizedText | null> {
  const portal = externalAdminLink();
  // A standalone Pages site without a linked Node host has no announcement API.
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
