/**
 * The Translator Robot store: owns the active target language, walks the
 * live DOM, translates every visible string and keeps translating as React
 * re-renders (route changes, new content) via a MutationObserver.
 *
 * Original strings are remembered per text node / attribute so switching
 * back to Arabic/English restores the page exactly. The robot's own UI is
 * excluded (`[data-translator-ui]`) and so is anything explicitly marked
 * `[data-no-translate]`, plus script/style/code content.
 */

import { useEffect, useSyncExternalStore } from 'react';
import { getLanguage, isRtlLanguage } from './languages';
import { isTranslatableText, translateBatch } from './translateEngine';
import { notifyRobotLanguageChange } from './globalLanguageSync';

export type RobotStatus = 'idle' | 'translating' | 'done' | 'error';

export interface RobotProgress {
  done: number;
  total: number;
}

export interface RobotState {
  /** Active target language code, or `null` when showing the native site. */
  target: string | null;
  /** Native source language the site is currently rendered in. */
  source: 'ar' | 'en';
  status: RobotStatus;
  progress: RobotProgress;
  error: string | null;
  /** Browser language detected on first visit (suggestion only). */
  detected: string | null;
}

const ROBOT_KEY = 'insco_robot_lang_v1';
const MANUAL_KEY = 'insco_robot_manual_v1';
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'SVG', 'CANVAS', 'TEXTAREA']);
const ATTR_NAMES = ['placeholder', 'aria-label', 'title'] as const;
const MAX_NODES_PER_PASS = 800;

interface NodeRecord {
  original: string;
  translated: string;
}

type Listener = () => void;

class TranslationRobotStore {
  private state: RobotState;
  private listeners = new Set<Listener>();
  private textOriginals = new WeakMap<Text, NodeRecord>();
  private attrOriginals = new WeakMap<Element, Map<string, NodeRecord>>();
  private observer: MutationObserver | null = null;
  private scanTimer: ReturnType<typeof setTimeout> | null = null;
  private applying = false;
  private runId = 0;

  constructor() {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(ROBOT_KEY);
    } catch {
      /* private mode */
    }
    this.state = {
      target: saved && getLanguage(saved) ? saved : null,
      source: 'ar',
      status: 'idle',
      progress: { done: 0, total: 0 },
      error: null,
      detected: null,
    };
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): RobotState => this.state;

  private broadcastChange(): void {
    if (typeof window === 'undefined') return;
    const detail = { target: this.state.target, source: this.state.source, ts: Date.now() } as unknown as Record<string, unknown>;
    try { window.dispatchEvent(new CustomEvent('insco:robot-changed', { detail })); } catch { /* ignore */ }
  }

  private setState(patch: Partial<RobotState>): void {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach(listener => listener());
  }

  /** Current active target (read by App so it does not fight over <html>). */
  getTarget(): string | null {
    return this.state.target;
  }

  setDetected(code: string | null): void {
    if (this.state.detected !== code) this.setState({ detected: code });
  }

  /** Tell the robot which native language the site is rendered in. */
  setSource(source: 'ar' | 'en'): void {
    if (this.state.source === source) return;
    const wasActive = this.state.target !== null;
    this.state = { ...this.state, source };
    if (wasActive) {
      // The whole page just re-rendered in the other native language:
      // forget the old originals and translate from the new source.
      this.textOriginals = new WeakMap();
      this.attrOriginals = new WeakMap();
      void this.applyAll();
    } else {
      this.listeners.forEach(listener => listener());
    }
  }

  /**
   * Translate the whole page into `code` (or restore when code is native).
   * `manual=true` (default) marks the choice as explicit so geo auto-run
   * stops overriding it for 30 days; auto-translation passes `manual:false`.
   */
  async enable(code: string, options: { manual?: boolean } = {}): Promise<void> {
    const { manual = true } = options;
    const language = getLanguage(code);
    if (!language) return;
    if (language.code === this.state.source) {
      this.disable({ manual });
      return;
    }
    if (this.state.target === language.code) return;
    this.restore();
    try {
      localStorage.setItem(ROBOT_KEY, language.code);
      if (manual) localStorage.setItem(MANUAL_KEY, String(Date.now()));
    } catch {
      /* private mode */
    }
    this.setState({ target: language.code, error: null });
    this.syncDocumentLanguage();
    this.broadcastChange();
    try { notifyRobotLanguageChange(language.code); } catch { /* ignore */ }
    await this.applyAll();
    this.startObserver();
  }

  /** Restore the native Arabic/English page. */
  disable(options: { manual?: boolean } = {}): void {
    const { manual = true } = options;
    this.runId += 1;
    this.stopObserver();
    this.restore();
    try {
      localStorage.removeItem(ROBOT_KEY);
      if (manual) localStorage.setItem(MANUAL_KEY, String(Date.now()));
    } catch {
      /* private mode */
    }
    this.setState({ target: null, status: 'idle', progress: { done: 0, total: 0 }, error: null });
    this.syncDocumentLanguage();
    this.broadcastChange();
    try { notifyRobotLanguageChange(null); } catch { /* ignore */ }
  }

  /** Re-run translation after a provider failure. */
  async retry(): Promise<void> {
    if (!this.state.target) return;
    this.restore();
    await this.applyAll();
  }

  destroy(): void {
    this.runId += 1;
    this.stopObserver();
    if (this.scanTimer) clearTimeout(this.scanTimer);
  }

  /* ------------------------------ DOM walking ----------------------------- */

  private isExcluded(node: Node): boolean {
    const parent = node.parentElement;
    if (!parent) return true;
    if (SKIP_TAGS.has(parent.tagName)) return true;
    if (parent.closest('[data-translator-ui]')) return true;
    if (parent.closest('[data-no-translate]')) return true;
    if (parent.closest('input, textarea, select')) return true;
    return false;
  }

  private collectTextNodes(): Text[] {
    if (typeof document === 'undefined' || !document.body) return [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: node => {
        const text = node as Text;
        if (!isTranslatableText(text.data)) return NodeFilter.FILTER_REJECT;
        if (this.isExcluded(text)) return NodeFilter.FILTER_REJECT;
        const record = this.textOriginals.get(text);
        // Already translated and untouched since: nothing to do.
        if (record && text.data === record.translated) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes: Text[] = [];
    let current = walker.nextNode() as Text | null;
    while (current && nodes.length < MAX_NODES_PER_PASS) {
      nodes.push(current);
      current = walker.nextNode() as Text | null;
    }
    return nodes;
  }

  private collectAttributeTargets(): { element: Element; attr: string; value: string }[] {
    if (typeof document === 'undefined' || !document.body) return [];
    const selector = ATTR_NAMES.map(attr => `[${attr}]`).join(',');
    const elements = document.body.querySelectorAll(selector);
    const targets: { element: Element; attr: string; value: string }[] = [];
    elements.forEach(element => {
      if (element.closest('[data-translator-ui]')) return;
      if (element.closest('[data-no-translate]')) return;
      for (const attr of ATTR_NAMES) {
        const value = element.getAttribute(attr);
        if (!value || !isTranslatableText(value)) continue;
        const record = this.attrOriginals.get(element)?.get(attr);
        if (record && value === record.translated) continue;
        targets.push({ element, attr, value });
      }
    });
    return targets;
  }

  /* ----------------------------- translation ------------------------------ */

  private async applyAll(): Promise<void> {
    const { target, source } = this.state;
    if (!target || typeof document === 'undefined') return;
    const run = ++this.runId;
    this.setState({ status: 'translating', error: null });

    const textNodes = this.collectTextNodes();
    const attrTargets = this.collectAttributeTargets();
    const uniqueTexts = [
      ...new Set([
        ...textNodes.map(node => node.data.trim()),
        ...attrTargets.map(t => t.value.trim()),
      ]),
    ];
    this.setState({ progress: { done: 0, total: uniqueTexts.length } });

    if (uniqueTexts.length === 0) {
      this.setState({ status: 'done', progress: { done: 0, total: 0 } });
      return;
    }

    const { translations, failed } = await translateBatch(uniqueTexts, source, target);

    if (run !== this.runId || this.state.target !== target) return; // superseded

    this.applying = true;
    try {
      for (const node of textNodes) {
        const original = node.data.trim();
        const translated = translations.get(original);
        if (!translated) continue;
        const record = this.textOriginals.get(node);
        const originalText = record && node.data === record.translated ? record.original : node.data;
        this.textOriginals.set(node, { original: originalText, translated });
        node.data = node.data.replace(original, translated);
      }
      for (const { element, attr, value } of attrTargets) {
        const translated = translations.get(value.trim());
        if (!translated) continue;
        let perElement = this.attrOriginals.get(element);
        if (!perElement) {
          perElement = new Map();
          this.attrOriginals.set(element, perElement);
        }
        const record = perElement.get(attr);
        const originalValue = record && value === record.translated ? record.original : value;
        perElement.set(attr, { original: originalValue, translated });
        element.setAttribute(attr, translated);
      }
    } finally {
      this.applying = false;
    }

    this.setState({
      status: failed.length === uniqueTexts.length ? 'error' : 'done',
      progress: { done: uniqueTexts.length - failed.length, total: uniqueTexts.length },
      error:
        failed.length === uniqueTexts.length
          ? 'تعذّرت الترجمة — تحقق من الاتصال وحاول مجدداً / Translation unavailable — check your connection and retry.'
          : null,
    });
  }

  private restore(): void {
    if (typeof document === 'undefined') return;
    this.applying = true;
    try {
      // Text nodes: walk everything and put originals back where recorded.
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode() as Text | null;
      while (node) {
        const record = this.textOriginals.get(node);
        if (record && node.data === record.translated) node.data = record.original;
        node = walker.nextNode() as Text | null;
      }
      document.body.querySelectorAll('[placeholder],[aria-label],[title]').forEach(element => {
        const perElement = this.attrOriginals.get(element);
        if (!perElement) return;
        perElement.forEach((record, attr) => {
          if (element.getAttribute(attr) === record.translated) {
            element.setAttribute(attr, record.original);
          }
        });
      });
    } finally {
      this.applying = false;
    }
    this.textOriginals = new WeakMap();
    this.attrOriginals = new WeakMap();
  }

  private syncDocumentLanguage(): void {
    if (typeof document === 'undefined') return;
    const { target, source } = this.state;
    const effective = target ?? source;
    document.documentElement.lang = effective;
    document.documentElement.dir = isRtlLanguage(effective) ? 'rtl' : 'ltr';
  }

  /* --------------------------- live re-render ----------------------------- */

  private startObserver(): void {
    if (this.observer || typeof MutationObserver === 'undefined' || !document.body) return;
    this.observer = new MutationObserver(() => {
      if (this.applying || !this.state.target) return;
      if (this.scanTimer) clearTimeout(this.scanTimer);
      this.scanTimer = setTimeout(() => {
        void this.scanNewNodes();
      }, 350);
    });
    this.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  private stopObserver(): void {
    this.observer?.disconnect();
    this.observer = null;
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
  }

  /** Translate only nodes React added/changed since the last pass. */
  private async scanNewNodes(): Promise<void> {
    const { target, source } = this.state;
    if (!target || this.state.status === 'translating') return;
    const textNodes = this.collectTextNodes();
    const attrTargets = this.collectAttributeTargets();
    if (textNodes.length === 0 && attrTargets.length === 0) return;
    const uniqueTexts = [
      ...new Set([
        ...textNodes.map(node => node.data.trim()),
        ...attrTargets.map(t => t.value.trim()),
      ]),
    ];
    const { translations } = await translateBatch(uniqueTexts, source, target);
    if (this.state.target !== target) return;
    this.applying = true;
    try {
      for (const node of textNodes) {
        const original = node.data.trim();
        const translated = translations.get(original);
        if (!translated) continue;
        const record = this.textOriginals.get(node);
        const originalText = record && node.data === record.translated ? record.original : node.data;
        this.textOriginals.set(node, { original: originalText, translated });
        node.data = node.data.replace(original, translated);
      }
      for (const { element, attr, value } of attrTargets) {
        const translated = translations.get(value.trim());
        if (!translated) continue;
        let perElement = this.attrOriginals.get(element);
        if (!perElement) {
          perElement = new Map();
          this.attrOriginals.set(element, perElement);
        }
        const record = perElement.get(attr);
        const originalValue = record && value === record.translated ? record.original : value;
        perElement.set(attr, { original: originalValue, translated });
        element.setAttribute(attr, translated);
      }
    } finally {
      this.applying = false;
    }
  }
}

/** Singleton: one robot per page, shared by the floating UI and App. */
export const translationRobot = new TranslationRobotStore();

/** Read the active target without subscribing (used by App's <html> sync). */
export function getRobotTarget(): string | null {
  return translationRobot.getTarget();
}

/** React binding for the robot UI. */
export function useTranslationRobot(source: 'ar' | 'en'): RobotState {
  const state = useSyncExternalStore(
    translationRobot.subscribe,
    translationRobot.getSnapshot,
    translationRobot.getSnapshot,
  );
  useEffect(() => {
    translationRobot.setSource(source);
  }, [source]);
  useEffect(() => () => translationRobot.destroy(), []);
  return state;
}
