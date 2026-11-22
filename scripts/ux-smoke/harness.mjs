import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import bundled from '@sparticuz/chromium';

export const repo = fileURLToPath(new URL('../../', import.meta.url));
export const root = new URL(process.env.QA_URL ?? 'http://127.0.0.1:4173/INSCONDTEG/').href;
export const pages = new URL(root).pathname;
export const docs = resolve(process.env.QA_DOCS ?? join(repo, 'docs'));
export const out = process.env.QA_OUTPUT ? resolve(process.env.QA_OUTPUT) : mkdtempSync(join(tmpdir(), 'insco-ux-smoke-'));
mkdirSync(out, { recursive: true });
console.error(`QA output: ${out}`);
export const axePath = fileURLToPath(import.meta.resolve('axe-core/axe.min.js'));

export async function launch({ disableWebGL = false } = {}) {
  const custom = process.env.CHROMIUM_EXECUTABLE;
  const args = custom ? [] : bundled.args;
  return chromium.launch({
    executablePath: custom || await bundled.executablePath(),
    args: disableWebGL ? [...args, '--disable-webgl'] : args,
    headless: true,
  });
}
