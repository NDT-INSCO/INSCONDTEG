/**
 * Global language sync — ensures a language change on any page
 * instantly propagates to the entire site:
 * - All portals (company / academy / client / network / admin)
 * - All lazy-loaded chunks
 * - All tabs/windows (cross-tab via storage + BroadcastChannel)
 *
 * Combines:
 * - CustomEvents (insco:language-changed) for intra-page components
 * - storage event for legacy cross-tab sync
 * - BroadcastChannel for instant cross-tab sync
 */

import { Language } from '../types';

const BC_NAME = 'insco_lang_sync';
const LS_SOURCE = 'insco_language_v1';
const LS_ROBOT = 'insco_robot_lang_v1';
const LS_BROADCAST = 'insco_lang_broadcast';

export interface LangChangeDetail {
  source?: Language | null; // native ar/en — absent means no native change
  target?: string | null;   // robot world language — null means restore, absent means no robot change
  origin: string;
  ts: number;
}

let channel: BroadcastChannel | null = null;
let channelHandlerAttached = false;
const tabId = Math.random().toString(36).slice(2);

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!channel) {
    try {
      channel = new BroadcastChannel(BC_NAME);
    } catch {
      return null;
    }
  }
  return channel;
}

function broadcast(detail: LangChangeDetail): void {
  const ch = getChannel();
  if (ch) {
    try { ch.postMessage(detail); } catch { /* ignore */ }
  }
  try {
    localStorage.setItem(LS_BROADCAST, JSON.stringify(detail));
  } catch { /* ignore */ }
}

/** Notify entire site: native language changed (ar/en) */
export function notifyNativeLanguageChange(next: Language): void {
  const detail: LangChangeDetail = { source: next, origin: tabId, ts: Date.now() };
  try { localStorage.setItem(LS_SOURCE, next); } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent<LangChangeDetail>('insco:language-changed', { detail })); } catch { /* ignore */ }
  broadcast(detail);
  try { window.dispatchEvent(new CustomEvent('insco:source-changed', { detail: { language: next } })); } catch { /* ignore */ }
}

/** Notify entire site: robot translation changed (world language) */
export function notifyRobotLanguageChange(target: string | null): void {
  const detail: LangChangeDetail = { target, origin: tabId, ts: Date.now() };
  if (target) {
    try { localStorage.setItem(LS_ROBOT, target); } catch { /* ignore */ }
  } else {
    try { localStorage.removeItem(LS_ROBOT); } catch { /* ignore */ }
  }
  try { window.dispatchEvent(new CustomEvent<LangChangeDetail>('insco:language-changed', { detail })); } catch { /* ignore */ }
  broadcast(detail);
}

/**
 * Subscribe to global language changes (intra-tab + cross-tab).
 * Caller receives detail; should update local state / re-apply translation.
 */
export function subscribeGlobalLanguage(
  cb: (detail: LangChangeDetail) => void
): () => void {
  const onCustom = (e: Event) => {
    const detail = (e as CustomEvent<LangChangeDetail>).detail;
    if (!detail) return;
    if (detail.origin === tabId) return;
    cb(detail);
  };

  const onStorage = (e: StorageEvent) => {
    if (e.key === LS_BROADCAST && e.newValue) {
      try {
        const detail = JSON.parse(e.newValue) as LangChangeDetail;
        if (detail.origin === tabId) return;
        cb(detail);
      } catch { /* ignore */ }
    }
    if (e.key === LS_SOURCE && e.newValue) {
      cb({ source: e.newValue as Language, origin: 'storage', ts: Date.now() });
    }
    if (e.key === LS_ROBOT) {
      cb({ source: undefined, target: e.newValue || null, origin: 'storage', ts: Date.now() });
    }
  };

  const ch = getChannel();
  const onMessage = (e: MessageEvent<LangChangeDetail>) => {
    if (!e.data) return;
    if ((e.data as LangChangeDetail).origin === tabId) return;
    cb(e.data as LangChangeDetail);
  };

  window.addEventListener('insco:language-changed', onCustom as EventListener);
  window.addEventListener('storage', onStorage);
  ch?.addEventListener('message', onMessage);

  return () => {
    window.removeEventListener('insco:language-changed', onCustom as EventListener);
    window.removeEventListener('storage', onStorage);
    ch?.removeEventListener('message', onMessage);
  };
}

export function getCurrentTabId(): string { return tabId; }
