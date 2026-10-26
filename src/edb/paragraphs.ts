import { EdbBlock, EdbText } from './types';

type OneLanguageBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] };

const LIST_PREFIX = /^(\d+[.)]|[\u0660-\u0669]+[.)]|[-•*])\s*/;

export function parseLanguageBlocks(raw: string): OneLanguageBlock[] {
  const lines = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const blocks: OneLanguageBlock[] = [];
  let pending: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (pending && pending.items.length) blocks.push({ type: 'list', ordered: pending.ordered, items: pending.items });
    pending = null;
  };

  lines.forEach(line => {
    const match = line.match(LIST_PREFIX);
    if (match) {
      const ordered = match[1].includes('.') || match[1].includes(')');
      const clean = line.replace(LIST_PREFIX, '').trim();
      if (!clean) return;
      if (pending && pending.ordered !== ordered) flush();
      if (!pending) pending = { ordered, items: [] };
      pending.items.push(clean);
      return;
    }
    flush();
    blocks.push({ type: 'paragraph', text: line });
  });
  flush();
  return blocks;
}

const text = (ar = '', en = ''): EdbText => ({ ar, en });

/**
 * Books in the repository are authored bilingually, but line and list counts do
 * not always match exactly. This merge keeps as much structure as possible:
 * identical block types are paired; mismatched types become a bilingual
 * paragraph; a block present in one language is kept with an empty counterpart.
 */
export function mergeBilingualBlocks(arRaw: string, enRaw: string): EdbBlock[] {
  const ar = parseLanguageBlocks(arRaw);
  const en = parseLanguageBlocks(enRaw);
  const merged: EdbBlock[] = [];
  const max = Math.max(ar.length, en.length);

  for (let i = 0; i < max; i += 1) {
    const a = ar[i];
    const e = en[i];
    if (a && e) {
      if (a.type === 'paragraph' && e.type === 'paragraph') {
        merged.push({ type: 'paragraph', text: text(a.text, e.text) });
      } else if (a.type === 'list' && e.type === 'list') {
        const itemCount = Math.max(a.items.length, e.items.length);
        merged.push({
          type: 'list',
          ordered: a.ordered || e.ordered,
          items: Array.from({ length: itemCount }, (_, j) => text(a.items[j] || '', e.items[j] || '')),
        });
      } else if (a.type === 'paragraph' && e.type === 'list') {
        merged.push({ type: 'paragraph', text: text(a.text, e.items.join(' ')) });
      } else if (a.type === 'list' && e.type === 'paragraph') {
        merged.push({ type: 'paragraph', text: text(a.items.join(' '), e.text) });
      }
      continue;
    }
    if (a) {
      if (a.type === 'paragraph') merged.push({ type: 'paragraph', text: text(a.text, '') });
      else merged.push({ type: 'list', ordered: a.ordered, items: a.items.map(item => text(item, '')) });
    }
    if (e) {
      if (e.type === 'paragraph') merged.push({ type: 'paragraph', text: text('', e.text) });
      else merged.push({ type: 'list', ordered: e.ordered, items: e.items.map(item => text('', item)) });
    }
  }

  return merged.filter(block => {
    if (block.type === 'paragraph') return Boolean(block.text.ar || block.text.en);
    if (block.type === 'list') return block.items.some(item => item.ar || item.en);
    return true;
  });
}
