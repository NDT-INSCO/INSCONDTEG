/**
 * Regression guard for audit item (D): every clickable surface must be reachable
 * and activatable by keyboard and announced to assistive technology.
 *
 * Two layers:
 *  1. the `clickable` / `clickableRow` contract (Enter + Space, no page scroll,
 *     focusable, labelled);
 *  2. a source scan that fails when a non-button element gets a bare `onClick`
 *     without either the helper or an explicit role + tabIndex.
 */
import React from 'react';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { clickable, clickableRow } from '../src/utils/a11y';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'src');

/** Elements that are not natively activatable by the keyboard. */
const NON_INTERACTIVE = new Set([
  'div', 'span', 'li', 'tr', 'td', 'th', 'section', 'article', 'header',
  'footer', 'aside', 'main', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img',
  'ul', 'ol', 'figure', 'label',
]);

/**
 * Files where a bare `onClick` is intentional and cannot be a control.
 * Keep this list empty unless there is a written reason.
 */
const ALLOWED_BARE_CLICKS: Array<{ file: string; reason: string }> = [];

function listTsxFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listTsxFiles(full);
    return entry.name.endsWith('.tsx') ? [full] : [];
  });
}

/** Read one JSX opening tag starting at `start` (index of `<`). */
function readOpeningTag(source: string, start: number): { name: string; attrs: string; end: number } | null {
  const nameMatch = /^<([A-Za-z][\w.$-]*)/.exec(source.slice(start, start + 80));
  if (!nameMatch) return null;
  const name = nameMatch[1].toLowerCase();
  let index = start + nameMatch[0].length;
  let braces = 0;
  let quote: string | null = null;
  while (index < source.length) {
    const char = source[index];
    if (quote) {
      if (char === quote && source[index - 1] !== '\\') quote = null;
    } else if (char === '"' || char === "'" || char === '`') {
      quote = char;
    } else if (char === '{') {
      braces += 1;
    } else if (char === '}') {
      braces -= 1;
    } else if (char === '>' && braces === 0 && source[index - 1] !== '=') {
      return { name, attrs: source.slice(start + nameMatch[0].length, index), end: index };
    }
    index += 1;
  }
  return null;
}

test('clickable() exposes a focusable, labelled button contract', () => {
  const calls: string[] = [];
  const props = clickable(event => calls.push(`handler:${event.type}`), 'Open gallery');

  assert.equal(props.role, 'button');
  assert.equal(props.tabIndex, 0);
  assert.equal(props['aria-label'], 'Open gallery');

  props.onClick({ type: 'click' } as unknown as React.MouseEvent<HTMLElement>);
  assert.deepEqual(calls, ['handler:click']);
});

test('clickable() activates with Enter and with Space, and stops Space scrolling', () => {
  let activations = 0;
  const props = clickable(() => {
    activations += 1;
  });

  let prevented = 0;
  const keyEvent = (key: string) =>
    ({
      key,
      preventDefault: () => {
        prevented += 1;
      },
    }) as unknown as React.KeyboardEvent<HTMLElement>;

  props.onKeyDown(keyEvent('Enter'));
  assert.equal(activations, 1);
  assert.equal(prevented, 1, 'Enter should be handled without leaking to the page');

  props.onKeyDown(keyEvent(' '));
  assert.equal(activations, 2, 'Space must activate the control');
  assert.equal(prevented, 2, 'Space must not scroll the page');

  props.onKeyDown(keyEvent('Tab'));
  assert.equal(activations, 2, 'other keys must be ignored');
  assert.equal(prevented, 2);
});

test('clickableRow() keeps the table row semantics but adds keyboard access', () => {
  let activations = 0;
  const props = clickableRow(() => {
    activations += 1;
  }, true);

  assert.equal(props.tabIndex, 0);
  assert.equal(props['aria-selected'], true);
  assert.equal(
    (props as Record<string, unknown>).role,
    undefined,
    'table rows must not be re-announced as buttons',
  );

  props.onKeyDown({
    key: 'Enter',
    preventDefault: () => {},
  } as unknown as React.KeyboardEvent<HTMLTableRowElement>);
  assert.equal(activations, 1);
});

test('no non-button element is clickable only with the mouse', () => {
  const offenders: string[] = [];

  for (const file of listTsxFiles(SRC)) {
    const source = fs.readFileSync(file, 'utf8');
    for (let cursor = source.indexOf('<'); cursor !== -1; cursor = source.indexOf('<', cursor + 1)) {
      const tag = readOpeningTag(source, cursor);
      if (!tag) continue;
      if (!NON_INTERACTIVE.has(tag.name)) continue;
      if (!/\bonClick\s*=/.test(tag.attrs)) continue;

      const helped =
        /clickable(Row)?\s*\(/.test(tag.attrs) ||
        (/\brole\s*=/.test(tag.attrs) && /\btabIndex\s*=/.test(tag.attrs));
      if (helped) continue;

      const relative = path.relative(ROOT, file).replaceAll('\\', '/');
      if (ALLOWED_BARE_CLICKS.some(entry => entry.file === relative)) continue;

      const line = source.slice(0, cursor).split('\n').length;
      offenders.push(`${relative}:${line} <${tag.name}> ${tag.attrs.replace(/\s+/g, ' ').trim().slice(0, 120)}`);
    }
  }

  assert.deepEqual(
    offenders,
    [],
    `Mouse-only controls found. Wrap the handler with clickable()/clickableRow() from src/utils/a11y.ts:\n${offenders.join('\n')}`,
  );
});
