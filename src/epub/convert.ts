/// <reference types="node" />
/**
 * EDB → EPUB 3 converter.
 *
 * The `.edb` files are the authored source of truth; this module produces a
 * standards-compliant EPUB 3 container from the same JSON so the library can be
 * read on Kindle, Kobo, Apple Books, Calibre and the browser-based readers that
 * only understand EPUB.
 *
 * Design decisions that are easy to second-guess later:
 *
 * - The edition is bilingual. Every page shows the Arabic text first, then the
 *   English text, each in its own `lang`/`dir` container. Splitting into two
 *   separate editions would double the catalogue and break the cross-references
 *   the EDB source already carries.
 * - The EPUB is light. The EDB reader uses a dark theme; e-ink devices and
 *   printed PDFs do not. Only the accent colour is carried over.
 * - Interactive experiments cannot run inside an EPUB (books may not execute
 *   scripts), so they become a short note plus a link to the web edition. That
 *   is stated in the note itself, not hidden.
 * - No remote resources, no embedded fonts, no JavaScript: the file validates
 *   and reads offline.
 */
import { createHash } from 'node:crypto';
import { formatFormula } from '../edb/format';
import { EdbBlock, EdbDocument, EdbPage, EdbText } from '../edb/types';
import { EpubIndexEntry, EPUB_GENERATOR, EPUB_VERSION } from './types';
import { writeZip, zipContentDigest, ZipInput } from './zip';

export interface EpubOptions {
  /** Release timestamp written to dc:date and dcterms:modified. */
  modified?: string;
  /** Public web app, linked from experiment notes. */
  webAppUrl?: string;
}

/**
 * Counts bilingual text units present in exactly one language. Reported rather
 * than hidden: the source textbooks have paragraphs and list items that were
 * never translated, and a reader deserves to know before downloading.
 */
export function countSingleLanguage(document: EdbDocument): number {
  let count = 0;
  const check = (text: EdbText | undefined) => {
    if (text && has(text, 'ar') !== has(text, 'en')) count += 1;
  };
  for (const page of document.pages) {
    check(page.title);
    for (const block of page.blocks) {
      switch (block.type) {
        case 'heading':
        case 'paragraph':
          check(block.text);
          break;
        case 'list':
          block.items.forEach(check);
          break;
        case 'callout':
          check(block.title);
          check(block.text);
          break;
        case 'quiz':
          check(block.question);
          block.options.forEach(check);
          check(block.explanation);
          break;
        case 'formula':
          check(block.caption);
          break;
        case 'experiment':
          check(block.label);
          break;
        case 'image':
          check(block.alt);
          break;
        default:
          break;
      }
    }
  }
  for (const entry of document.glossary || []) {
    check(entry.term);
    check(entry.definition);
  }
  return count;
}

export interface EpubBuild {
  id: string;
  file: string;
  kind: 'textbook' | 'course';
  buffer: Buffer;
  entries: ZipInput[];
  warnings: string[];
  pages: number;
  title: EdbText;
  entry: EpubIndexEntry;
}

const DEFAULT_WEB_APP = 'https://ndt-insco.github.io/-Project-/';
const DEFAULT_MODIFIED = '2026-10-21T00:00:00Z';

/* ------------------------------------------------------------------ */
/* text helpers                                                        */
/* ------------------------------------------------------------------ */

/** XML-safe text. Control characters are illegal in XML 1.0, so they go first. */
function esc(value: string): string {
  return String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function has(text: EdbText | undefined, language: 'ar' | 'en'): boolean {
  return Boolean(text && typeof text[language] === 'string' && text[language].trim());
}

/** Text present in at least one language; used to decide whether to render a block at all. */
function anyText(text: EdbText | undefined): boolean {
  return has(text, 'ar') || has(text, 'en');
}

function pick(text: EdbText | undefined, language: 'ar' | 'en'): string {
  if (!text) return '';
  const direct = text[language];
  return direct && direct.trim() ? direct : text[language === 'ar' ? 'en' : 'ar'] || '';
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return [56, 189, 248];
  return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map(value => Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, '0')).join('')}`;
}

function mix(from: string, to: string, amount: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex([a[0] + (b[0] - a[0]) * amount, a[1] + (b[1] - a[1]) * amount, a[2] + (b[2] - a[2]) * amount]);
}

/** Deterministic UUID v5 (SHA-1, URL namespace) so rebuilds keep the same id. */
function uuidFor(name: string): string {
  const namespace = Buffer.from('6ba7b8119dad11d180b400c04fd430c8', 'hex');
  const hash = createHash('sha1').update(namespace).update(Buffer.from(name, 'utf8')).digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function safeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

/** Greedy word wrap for the SVG cover, which has no layout engine. */
function wrapWords(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = candidate;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === maxLines) {
    const consumed = lines.join(' ').split(/\s+/).length;
    if (consumed < words.length) {
      const last = lines[maxLines - 1];
      lines[maxLines - 1] = `${last.replace(/[.,،;؛]$/, '')}…`;
    }
  }
  return lines;
}

/* ------------------------------------------------------------------ */
/* CSS                                                                 */
/* ------------------------------------------------------------------ */

function stylesheet(document: EdbDocument): string {
  const accent = document.theme.accent || '#38bdf8';
  const accentInk = mix(accent, '#000000', 0.42);
  const accentSoft = mix(accent, '#ffffff', 0.88);
  return `/* INSCO EPUB edition — light, print-safe, no remote fonts. */
html { -webkit-text-size-adjust: 100%; }
body {
  margin: 0 5%;
  color: #1b2029;
  background: #ffffff;
  font-family: "Noto Naskh Arabic", "Amiri", "Scheherazade New", "Traditional Arabic", Georgia, "Times New Roman", serif;
  font-size: 1em;
  line-height: 1.8;
  text-align: start;
}
.page { max-width: 46em; margin: 0 auto; padding: 1.2em 0 2em; }
.page-head {
  display: block;
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 0.62em;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #8a93a1;
  border-bottom: 1px solid #e6e9ef;
  padding-bottom: 0.6em;
  margin-bottom: 1.4em;
}
.page-head .pnum { float: inline-end; }
h1.page-title {
  font-size: 1.5em;
  line-height: 1.35;
  margin: 0 0 0.35em;
  color: #10141b;
  border-inline-start: 0.28em solid ${accent};
  padding-inline-start: 0.5em;
}
h1.page-title .en { display: block; font-size: 0.66em; color: #5b6473; font-weight: 500; margin-top: 0.3em; line-height: 1.4; }
h2.bh, h3.bh, h4.bh { font-size: 1.16em; margin: 1.5em 0 0.6em; color: ${accentInk}; line-height: 1.4; }
h3.bh { font-size: 1.06em; }
h4.bh { font-size: 0.98em; }
h2.bh .en, h3.bh .en, h4.bh .en { display: block; font-size: 0.78em; color: #6b7383; font-weight: 500; }
.bi { margin: 0 0 0.9em; }
.bi p { margin: 0.25em 0; }
.bi .en { color: #4c5563; font-size: 0.94em; }
ol, ul { margin: 0.4em 0 0.8em; padding-inline-start: 1.4em; }
li { margin: 0.2em 0; }
ol.en, ul.en { color: #4c5563; font-size: 0.94em; }
.formula {
  direction: ltr;
  text-align: left;
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 0.92em;
  background: #f4f6f9;
  border-inline-start: 3px solid ${accentSoft};
  border-radius: 4px;
  padding: 0.7em 0.9em;
  margin: 0.8em 0;
  overflow-wrap: anywhere;
}
.callout {
  border-inline-start: 4px solid ${accent};
  background: ${accentSoft};
  padding: 0.8em 1em;
  margin: 1em 0;
  border-radius: 4px;
  break-inside: avoid;
}
.callout.warning { border-inline-start-color: #d97706; background: #fdf6e9; }
.callout.success { border-inline-start-color: #059669; background: #ecf8f2; }
.callout-title { font-weight: 700; margin: 0 0 0.3em; color: ${accentInk}; }
.callout.warning .callout-title { color: #92400e; }
.callout.success .callout-title { color: #065f46; }
.quiz {
  border: 1px solid #dfe4ec;
  border-radius: 6px;
  padding: 0.9em 1.1em;
  margin: 1.1em 0;
  break-inside: avoid;
}
.quiz-kicker {
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 0.66em;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: ${accentInk};
  margin: 0 0 0.5em;
}
.quiz .q { font-weight: 600; }
.quiz ol.options { margin: 0.5em 0; }
.quiz details { margin-top: 0.6em; }
.quiz summary { cursor: pointer; font-weight: 700; color: ${accentInk}; }
.quiz .answer { margin: 0.5em 0 0; }
.experiment {
  border: 1px dashed ${accent};
  border-radius: 6px;
  padding: 0.8em 1em;
  margin: 1em 0;
  background: #fbfcfe;
  break-inside: avoid;
}
.experiment .exp-kicker { font-size: 0.7em; letter-spacing: 0.08em; text-transform: uppercase; color: #6b7383; margin: 0 0 0.35em; }
.experiment .note { font-size: 0.86em; color: #6b7383; margin: 0.4em 0; }
.source { display: block; font-size: 0.86em; margin: 0.3em 0; color: #4c5563; overflow-wrap: anywhere; }
.source a { color: ${accentInk}; }
.source .publisher { color: #8a93a1; }
figure { margin: 1em 0; }
figure img { max-width: 100%; height: auto; }
figcaption { font-size: 0.84em; color: #6b7383; }
.page-foot {
  border-top: 1px solid #e6e9ef;
  margin-top: 2.4em;
  padding-top: 0.7em;
  font-family: "Helvetica Neue", Arial, sans-serif;
  font-size: 0.64em;
  letter-spacing: 0.06em;
  color: #97a0ad;
}
.meta-table { width: 100%; border-collapse: collapse; font-size: 0.9em; margin: 0.8em 0 1.4em; }
.meta-table th, .meta-table td { text-align: start; padding: 0.4em 0.5em; border-bottom: 1px solid #edf0f5; vertical-align: top; }
.meta-table th { width: 34%; font-weight: 600; color: #4c5563; }
.notice {
  border: 1px solid #f0d9a8;
  background: #fdf7ea;
  border-radius: 6px;
  padding: 1em 1.1em;
  margin: 1.2em 0;
}
.notice h2 { margin-top: 0; font-size: 1.05em; color: #92400e; }
.cover-page { margin: 0; padding: 0; text-align: center; background: #0b0f1c; }
.cover-page img { width: 100%; height: auto; }
h1.doc-title { font-size: 1.7em; line-height: 1.35; margin: 0 0 0.2em; color: #10141b; }
p.doc-subtitle { font-size: 1.02em; color: #4c5563; margin: 0 0 1.4em; }
p.doc-subtitle .en { display: block; font-size: 0.86em; color: #6b7383; margin-top: 0.3em; }
`;
}

/* ------------------------------------------------------------------ */
/* blocks                                                              */
/* ------------------------------------------------------------------ */

interface Context {
  document: EdbDocument;
  warnings: string[];
  sources: Map<string, { title: string; url: string; publisher?: string }>;
  webAppUrl: string;
}

function biParagraph(text: EdbText, className = ''): string {
  if (!anyText(text)) return '';
  const cls = className ? ` ${className}` : '';
  const ar = has(text, 'ar') ? `<p lang="ar" dir="rtl">${esc(pick(text, 'ar'))}</p>` : '';
  // A missing translation is left out; showing Arabic inside a lang="en" element
  // would claim the text is English. The build reports how many blocks that hits.
  const en = has(text, 'en') ? `<p class="en" lang="en" dir="ltr">${esc(pick(text, 'en'))}</p>` : '';
  return `<div class="bi${cls}">${ar}${en}</div>`;
}

function heading(block: Extract<EdbBlock, { type: 'heading' }>): string {
  if (!anyText(block.text)) return '';
  const level = Math.min(6, block.level + 1);
  const ar = has(block.text, 'ar') ? `<span lang="ar" dir="rtl">${esc(pick(block.text, 'ar'))}</span>` : '';
  const en = has(block.text, 'en') ? `<span class="en" lang="en" dir="ltr">${esc(pick(block.text, 'en'))}</span>` : '';
  return `<h${level} class="bh">${ar}${en}</h${level}>`;
}

function list(block: Extract<EdbBlock, { type: 'list' }>): string {
  const tag = block.ordered ? 'ol' : 'ul';
  // Items without a translation are omitted from that language's list instead of
  // being printed untranslated (which also shifts the numbering, so it is right
  // to drop them rather than keep a placeholder).
  const items = (language: 'ar' | 'en') =>
    block.items
      .filter(item => has(item, language))
      .map(item => `<li lang="${language}" dir="${language === 'ar' ? 'rtl' : 'ltr'}">${esc(pick(item, language))}</li>`)
      .join('');
  const ar = items('ar');
  const en = items('en');
  if (!ar && !en) return '';
  return `<div class="bi">${ar ? `<${tag} lang="ar" dir="rtl">${ar}</${tag}>` : ''}${en ? `<${tag} class="en" lang="en" dir="ltr">${en}</${tag}>` : ''}</div>`;
}

function callout(block: Extract<EdbBlock, { type: 'callout' }>): string {
  const calloutTitle = block.title && anyText(block.title)
    ? `<p class="callout-title">${has(block.title, 'ar') ? `<span lang="ar" dir="rtl">${esc(pick(block.title, 'ar'))}</span>` : ''}${
        has(block.title, 'en') ? ` <span class="en" lang="en" dir="ltr">${has(block.title, 'ar') ? '/ ' : ''}${esc(pick(block.title, 'en'))}</span>` : ''
      }</p>`
    : '';
  return `<aside class="callout ${block.tone}">${calloutTitle}${biParagraph(block.text)}</aside>`;
}

function quiz(block: Extract<EdbBlock, { type: 'quiz' }>): string {
  const options = block.options
    .map((option, index) => {
      const ar = has(option, 'ar') ? `<span lang="ar" dir="rtl">${esc(pick(option, 'ar'))}</span>` : '';
      const en = has(option, 'en') ? `<span class="en" lang="en" dir="ltr">${esc(pick(option, 'en'))}</span>` : '';
      return `<li value="${index + 1}">${ar}${ar && en ? '<br/>' : ''}${en}</li>`;
    })
    .join('');
  const correct = block.options[block.answer];
  const answer = correct
    ? `<p class="answer">${has(correct, 'ar') ? `<b lang="ar" dir="rtl">الإجابة الصحيحة: ${block.answer + 1} — ${esc(pick(correct, 'ar'))}</b>` : ''}${
        has(correct, 'ar') && has(correct, 'en') ? '<br/>' : ''
      }${has(correct, 'en') ? `<b lang="en" dir="ltr">Correct answer: ${block.answer + 1} — ${esc(pick(correct, 'en'))}</b>` : ''}</p>`
    : '';
  return `<div class="quiz" id="${esc(block.id)}">
<p class="quiz-kicker">فحص فهم · Knowledge check</p>
${biParagraph(block.question).replace('class="bi"', 'class="bi q"')}
<ol class="options">${options}</ol>
<details><summary>اعرض الإجابة · Show answer</summary>${answer}${biParagraph(block.explanation)}</details>
</div>`;
}

function source(block: Extract<EdbBlock, { type: 'source' }>, ctx: Context): string {
  const url = safeUrl(block.url);
  if (!url) {
    ctx.warnings.push(`skipped a non-http source link: ${block.url}`);
    return `<span class="source">${esc(block.title)}</span>`;
  }
  ctx.sources.set(url, { title: block.title, url, publisher: block.publisher });
  const publisher = block.publisher ? `<span class="publisher"> — ${esc(block.publisher)}</span>` : '';
  return `<cite class="source"><a href="${esc(url)}">${esc(block.title)}</a>${publisher}</cite>`;
}

function experiment(block: Extract<EdbBlock, { type: 'experiment' }>, ctx: Context): string {
  const href = `${ctx.webAppUrl.replace(/\/?$/, '/')}#labs`;
  return `<aside class="experiment">
<p class="exp-kicker">تجربة تفاعلية · Interactive lab</p>
<div class="bi"><p lang="ar" dir="rtl">${esc(pick(block.label, 'ar'))}</p><p class="en" lang="en" dir="ltr">${esc(pick(block.label, 'en'))}</p></div>
<p class="note" lang="ar" dir="rtl">هذه التجربة لا تعمل داخل ملف EPUB لأن الكتب لا تشغّل برامج. افتحها في نسخة الويب: <a href="${esc(href)}">${esc(href)}</a> (معرّف التجربة: <span dir="ltr">${esc(block.experimentId)}</span>).</p>
<p class="note" lang="en" dir="ltr">This experiment cannot run inside an EPUB because books may not execute scripts. Open it in the web edition: <a href="${esc(href)}">${esc(href)}</a> (experiment id: ${esc(block.experimentId)}).</p>
</aside>`;
}

function image(block: Extract<EdbBlock, { type: 'image' }>, ctx: Context): string {
  ctx.warnings.push(`image not embedded (${block.src}); EPUB output is text-only for now`);
  return `<p class="source" lang="ar" dir="rtl">[صورة غير مضمّنة في هذه الطبعة: ${esc(pick(block.alt, 'ar'))}]</p><p class="source" lang="en" dir="ltr">[Image not embedded in this edition: ${esc(pick(block.alt, 'en'))}]</p>`;
}

function renderBlock(block: EdbBlock, ctx: Context): string {
  switch (block.type) {
    case 'heading':
      return heading(block);
    case 'paragraph':
      return biParagraph(block.text);
    case 'list':
      return list(block);
    case 'formula': {
      const caption = block.caption ? biParagraph(block.caption) : '';
      return `<div class="formula"><code>${esc(formatFormula(block.expression))}</code></div>${caption}`;
    }
    case 'callout':
      return callout(block);
    case 'quiz':
      return quiz(block);
    case 'source':
      return source(block, ctx);
    case 'experiment':
      return experiment(block, ctx);
    case 'image':
      return image(block, ctx);
    default:
      return '';
  }
}

/* ------------------------------------------------------------------ */
/* documents                                                           */
/* ------------------------------------------------------------------ */

function xhtml(title: string, body: string, bodyClass = ''): string {
  const cls = bodyClass ? ` class="${bodyClass}"` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="ar" lang="ar">
<head>
<meta charset="utf-8"/>
<title>${esc(title)}</title>
<link rel="stylesheet" type="text/css" href="../styles/book.css"/>
</head>
<body${cls}>
${body}
</body>
</html>
`;
}

function coverSvg(document: EdbDocument): string {
  const accent = document.theme.accent || '#38bdf8';
  const accent2 = mix(accent, '#ffffff', 0.35);
  const title = pick(document.metadata.title, 'ar');
  const subtitle = pick(document.metadata.subtitle, 'ar');
  const titleEnText = pick(document.metadata.title, 'en');
  const subtitleEnText = pick(document.metadata.subtitle, 'en');
  const discipline = document.metadata.relatedDiscipline || 'NDT';
  const standards = (document.metadata.standards || []).slice(0, 3).join(' · ');

  const titleLines = wrapWords(title, 26, 4);
  const subtitleLines = wrapWords(subtitle, 34, 3);
  const titleEnLines = wrapWords(titleEnText, 30, 3);
  const subtitleEnLines = wrapWords(subtitleEnText, 44, 2);

  let y = 520;
  const titleAr = titleLines
    .map((line, index) => `<text x="1450" y="${y + index * 92}" text-anchor="end" font-size="76" font-weight="700" fill="#f4f7fb">${esc(line)}</text>`)
    .join('');
  y += (titleLines.length - 1) * 92 + 92;
  const subtitleAr = subtitleLines
    .map((line, index) => `<text x="1450" y="${y + index * 54}" text-anchor="end" font-size="38" fill="#b9c4d6">${esc(line)}</text>`)
    .join('');
  y += (subtitleLines.length - 1) * 54 + 120;

  const titleEnStart = Math.max(y, 1180);
  const titleEn = titleEnLines
    .map((line, index) => `<text x="150" y="${titleEnStart + index * 60}" font-size="46" font-weight="600" fill="#e9eef7" opacity="0.94">${esc(line)}</text>`)
    .join('');
  const subtitleEn = subtitleEnLines
    .map((line, index) => `<text x="150" y="${titleEnStart + titleEnLines.length * 60 + 34 + index * 42}" font-size="28" fill="#93a1b8">${esc(line)}</text>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2400" viewBox="0 0 1600 2400" role="img" aria-label="${esc(title)}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="#0a0e19"/>
<stop offset="0.55" stop-color="#101728"/>
<stop offset="1" stop-color="#070a12"/>
</linearGradient>
<radialGradient id="glow" cx="0.82" cy="0.12" r="0.55">
<stop offset="0" stop-color="${accent}" stop-opacity="0.42"/>
<stop offset="1" stop-color="${accent}" stop-opacity="0"/>
</radialGradient>
</defs>
<rect width="1600" height="2400" fill="url(#bg)"/>
<rect width="1600" height="2400" fill="url(#glow)"/>
<g stroke="${accent}" stroke-opacity="0.22">
<circle cx="1320" cy="380" r="300" fill="none"/>
<circle cx="1320" cy="380" r="430" fill="none" stroke-opacity="0.12"/>
</g>
<text x="150" y="176" font-family="Helvetica, Arial, sans-serif" font-size="46" letter-spacing="10" fill="${accent}">INSCO</text>
<text x="150" y="228" font-family="Helvetica, Arial, sans-serif" font-size="20" letter-spacing="4" fill="#7f8ba1">ENGINEERING DIGITAL BOOK</text>
<line x1="150" y1="268" x2="1450" y2="268" stroke="${accent}" stroke-opacity="0.5" stroke-width="2"/>
<text x="150" y="336" font-family="Helvetica, Arial, sans-serif" font-size="22" letter-spacing="6" fill="${accent2}">${esc(discipline.toUpperCase())} · EDB / EPUB</text>
${titleAr}
${subtitleAr}
<line x1="150" y1="${Math.min(titleEnStart - 70, 1750)}" x2="1450" y2="${Math.min(titleEnStart - 70, 1750)}" stroke="${accent}" stroke-opacity="0.35" stroke-width="2"/>
${titleEn}
${subtitleEn}
<g font-family="Helvetica, Arial, sans-serif">
<text x="150" y="2130" font-size="24" fill="#8b97ad">${esc(standards || 'ASNT · ISO · ASME · API')}</text>
<text x="150" y="2178" font-size="22" fill="#5d6a80">ndt-insco.github.io/-Project-</text>
<text x="1450" y="2178" text-anchor="end" font-size="22" fill="#5d6a80">${esc(document.metadata.edition)}</text>
</g>
<text x="1450" y="2300" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="300" font-weight="700" fill="${accent}" opacity="0.07">${esc((document.metadata.relatedDiscipline || 'NDT').slice(0, 3))}</text>
</svg>
`;
}

function coverPage(document: EdbDocument): string {
  const title = pick(document.metadata.title, 'ar');
  const titleEn = pick(document.metadata.title, 'en');
  return xhtml(
    title,
    `<div class="cover-page"><img src="../images/cover.svg" alt="${esc(`${title} — ${titleEn}`)}"/></div>`,
    'cover-page'
  );
}

function frontMatter(document: EdbDocument, pageCount: number): string {
  const title = pick(document.metadata.title, 'ar');
  const subtitle = pick(document.metadata.subtitle, 'ar');
  const body = `<div class="page">
<h1 class="doc-title" lang="ar" dir="rtl">${esc(title)}</h1>
<p class="doc-subtitle" lang="ar" dir="rtl">${esc(subtitle)}<span class="en" lang="en" dir="ltr">${esc(pick(document.metadata.subtitle, 'en'))}</span></p>
<table class="meta-table">
<tr><th>المؤلف</th><td lang="ar" dir="rtl">${esc(pick(document.metadata.author, 'ar'))}</td></tr>
<tr><th>الناشر</th><td>${esc(document.metadata.publisher)}</td></tr>
<tr><th>الطبعة</th><td>${esc(document.metadata.edition)}</td></tr>
<tr><th>الصفحات</th><td>${pageCount}</td></tr>
<tr><th>اللغة</th><td>العربية والإنجليزية (ثنائي اللغة)</td></tr>
<tr><th>الترخيص</th><td>${esc(document.metadata.rights.license)}</td></tr>
</table>
<h2 class="bh">كيف تقرأ هذه الطبعة</h2>
<ul lang="ar" dir="rtl">
<li>كل صفحة تعرض النص العربي أولاً، ثم النص الإنجليزي المقابل له. النص الإنجليزي بلون أهدأ لتمييزه دون حجبه.</li>
<li>استخدم فهرس القارئ (جدول المحتويات) للتنقل بين الفصول؛ كل صفحة تبدأ بترويسة تحمل رقمها.</li>
<li>أسئلة «فحص الفهم» للتدريب الذاتي: اضغط «اعرض الإجابة» لرؤية التفسير.</li>
<li>التجارب التفاعلية لا تعمل داخل EPUB؛ تجد رابطها في نسخة الويب.</li>
<li>الروابط الخارجية تفتح في متصفح الجهاز وتحتاج اتصالاً.</li>
</ul>
<h2 class="bh">How to read this edition</h2>
<ul class="en" lang="en" dir="ltr">
<li>Every page shows the Arabic text first and its English counterpart below, in a quieter colour.</li>
<li>Use your reader's table of contents to move between chapters; each page header carries its number.</li>
<li>“Knowledge check” questions are for self-study — open “Show answer” to read the explanation.</li>
<li>Interactive experiments do not run inside an EPUB; the web edition links them.</li>
<li>External links open in your device browser and need a connection.</li>
</ul>
<div class="notice">
<h2>إفادة تعلم ذاتي — ليست شهادة</h2>
<p lang="ar" dir="rtl">هذه الطبعة مادة دراسة ذاتية. لا تُصدر شهادة، ولا تتحقق من هوية القارئ، ولا تسجّل ساعات تدريب أو خبرة، ولا تمنح أي اعتماد من ASNT أو ISO أو أي جهة مانحة. أي ادعاء بغير ذلك غير صحيح.</p>
<p lang="en" dir="ltr">This edition is self-study material. It issues no certificate, verifies no identity, records no training hours or experience, and grants no accreditation from ASNT, ISO or any awarding body. Any claim to the contrary is false.</p>
</div>
</div>`;
  return xhtml(title, body);
}

function pageDocument(document: EdbDocument, page: EdbPage, ctx: Context, index: number, total: number): string {
  const title = pick(page.title, 'ar');
  const blocks = page.blocks.map(block => renderBlock(block, ctx)).filter(Boolean).join('\n');
  const discipline = document.metadata.relatedDiscipline || 'NDT';
  const body = `<div class="page">
<p class="page-head">${esc(discipline)} · ${esc(pick(document.metadata.title, 'ar').slice(0, 48))}<span class="pnum">${index + 1} / ${total}</span></p>
<h1 class="page-title"><span lang="ar" dir="rtl">${esc(title)}</span><span class="en" lang="en" dir="ltr">${esc(pick(page.title, 'en'))}</span></h1>
${blocks}
<p class="page-foot">${esc(document.metadata.publisher)} · ${esc(document.metadata.edition)} · ${esc(page.kind)}</p>
</div>`;
  return xhtml(title, body);
}

function backMatter(document: EdbDocument, ctx: Context): string {
  const sources = [...ctx.sources.values()];
  const sourceList = sources.length
    ? `<ul class="en" dir="ltr">${sources
        .map(item => `<li><a href="${esc(item.url)}">${esc(item.title)}</a>${item.publisher ? ` — ${esc(item.publisher)}` : ''}</li>`)
        .join('')}</ul>`
    : '<p>—</p>';
  const glossary = document.glossary?.length
    ? `<h2 class="bh">المصطلحات<span class="en" lang="en" dir="ltr">Glossary</span></h2><dl>${document.glossary
        .map(entry => `<dt lang="ar" dir="rtl">${esc(pick(entry.term, 'ar'))}${has(entry.term, 'en') ? ` <span class="en" lang="en" dir="ltr">/ ${esc(pick(entry.term, 'en'))}</span>` : ''}</dt><dd lang="ar" dir="rtl">${esc(pick(entry.definition, 'ar'))}${has(entry.definition, 'en') ? `<br/><span class="en" lang="en" dir="ltr">${esc(pick(entry.definition, 'en'))}</span>` : ''}</dd>`)
        .join('')}</dl>`
    : '';
  const standards = (document.metadata.standards || []).map(code => `<li><code>${esc(code)}</code></li>`).join('');
  const body = `<div class="page">
<h1 class="page-title">حول هذه الطبعة<span class="en" lang="en" dir="ltr">About this edition</span></h1>
<table class="meta-table">
<tr><th>المعرّف</th><td dir="ltr">${esc(document.id)}</td></tr>
<tr><th>الطبعة</th><td>${esc(document.metadata.edition)}</td></tr>
<tr><th>الناشر</th><td>${esc(document.metadata.publisher)}</td></tr>
<tr><th>حقوق النشر</th><td>${esc(document.metadata.rights.holder)}</td></tr>
<tr><th>الترخيص</th><td>${esc(document.metadata.rights.license)}</td></tr>
<tr><th>صيغة المصدر</th><td dir="ltr">EDB v1.0</td></tr>
<tr><th>صيغة النشر</th><td dir="ltr">EPUB ${EPUB_VERSION}</td></tr>
</table>
${document.metadata.sourceNote ? biParagraph(document.metadata.sourceNote) : ''}
<h2 class="bh">حدود الاستخدام<span class="en" lang="en" dir="ltr">Scope of use</span></h2>
${biParagraph(document.metadata.rights.notice)}
<div class="notice">
<h2>ما لا تقدمه هذه الطبعة</h2>
<ul lang="ar" dir="rtl">
<li>ليست شهادة ولا إفادة اعتماد، ولا تحمل أي شعار أو رقم اعتماد من جهة مانحة.</li>
<li>لا تتحقق من هوية القارئ ولا تمنع النسخ؛ لا تعتمد عليها في إثبات كفاءة.</li>
<li>لا تسجّل ساعات تدريب أو خبرة عملية، ولا تُغني عن السجل التدريبي الرسمي.</li>
<li>الأمثلة والمحاكاة للتعليم فقط؛ قرارات القبول الفني تُبنى على الكود المرخص في العقد.</li>
</ul>
<ul class="en" lang="en" dir="ltr">
<li>It is not a certificate or an accreditation statement and carries no awarding-body mark or number.</li>
<li>It does not verify the reader's identity and cannot prevent copying; it is not evidence of competence.</li>
<li>It records no training hours or practical experience and does not replace an official training record.</li>
<li>Examples and simulations are teaching aids; acceptance decisions follow the licensed contract code.</li>
</ul>
</div>
${standards ? `<h2 class="bh">المراجع المرتبطة<span class="en" lang="en" dir="ltr">Related references</span></h2><ul dir="ltr">${standards}</ul>` : ''}
${glossary}
<h2 class="bh">المصادر<span class="en" lang="en" dir="ltr">Sources</span></h2>
${sourceList}
<p class="page-foot">${esc(document.metadata.publisher)} · ${esc(document.generator)} · EPUB ${EPUB_VERSION} · ${esc(EPUB_GENERATOR)}</p>
</div>`;
  return xhtml('حول هذه الطبعة', body);
}

/* ------------------------------------------------------------------ */
/* package files                                                       */
/* ------------------------------------------------------------------ */

function navDocument(document: EdbDocument, pages: EdbPage[], pageFiles: string[]): string {
  const byId = new Map(pages.map((page, index) => [page.id, index]));
  const chapters = document.chapters
    .map((chapter, chapterIndex) => {
      const first = chapter.pageIds.map(id => byId.get(id)).find(index => index !== undefined);
      const items = chapter.pageIds
        .map(id => byId.get(id))
        .filter((index): index is number => index !== undefined)
        .map(index => `<li><a href="text/${pageFiles[index]}">${esc(pick(pages[index].title, 'ar'))}</a></li>`)
        .join('');
      const label = `<a href="${first === undefined ? 'text/front.xhtml' : `text/${pageFiles[first]}`}">${esc(pick(chapter.title, 'ar'))}</a>`;
      const en = `<span class="en" lang="en" dir="ltr">${esc(pick(chapter.title, 'en'))}</span>`;
      return `<li>${label}${en}${items ? `<ol>${items}</ol>` : ''}</li>`;
    })
    .join('');

  const body = `<nav epub:type="toc" id="toc" role="doc-toc">
<h1 class="page-title">الفهرس<span class="en" lang="en" dir="ltr">Contents</span></h1>
<ol>
<li><a href="text/cover.xhtml">الغلاف · Cover</a></li>
<li><a href="text/front.xhtml">عن هذه الطبعة · About this edition</a></li>
${chapters}
<li><a href="text/back.xhtml">حدود الاستخدام والمصادر · Scope and sources</a></li>
</ol>
</nav>
<nav epub:type="landmarks" id="landmarks" hidden="hidden">
<h2>Landmarks</h2>
<ol>
<li><a epub:type="cover" href="text/cover.xhtml">Cover</a></li>
<li><a epub:type="toc" href="nav.xhtml">Contents</a></li>
<li><a epub:type="bodymatter" href="text/${pageFiles[0] || 'front.xhtml'}">Start of content</a></li>
</ol>
</nav>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="ar" lang="ar">
<head>
<meta charset="utf-8"/>
<title>الفهرس — ${esc(pick(document.metadata.title, 'ar'))}</title>
<link rel="stylesheet" type="text/css" href="styles/book.css"/>
</head>
<body>
<div class="page">
${body}
</div>
</body>
</html>
`;
}

function ncxDocument(document: EdbDocument, chapters: { title: EdbText; file: string }[], identifier: string): string {
  const navPoints = chapters
    .map(
      (chapter, index) => `<navPoint id="np-${index + 1}" playOrder="${index + 1}"><navLabel><text>${esc(pick(chapter.title, 'ar'))}</text></navLabel><content src="${esc(chapter.file)}"/></navPoint>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1" xml:lang="ar">
<head>
<meta name="dtb:uid" content="${esc(identifier)}"/>
<meta name="dtb:depth" content="1"/>
<meta name="dtb:totalPageCount" content="0"/>
<meta name="dtb:maxPageNumber" content="0"/>
</head>
<docTitle><text>${esc(pick(document.metadata.title, 'ar'))}</text></docTitle>
<navMap>
${navPoints || `<navPoint id="np-1" playOrder="1"><navLabel><text>${esc(pick(document.metadata.title, 'ar'))}</text></navLabel><content src="text/front.xhtml"/></navPoint>`}
</navMap>
</ncx>
`;
}

function opfDocument(document: EdbDocument, pages: EdbPage[], pageFiles: string[], identifier: string, modified: string): string {
  const titleAr = pick(document.metadata.title, 'ar');
  const titleEn = pick(document.metadata.title, 'en');
  const subjects = (document.metadata.keywords || [])
    .map(keyword => `<dc:subject>${esc(pick(keyword, 'ar'))}</dc:subject>`)
    .join('\n    ');
  const date = modified.slice(0, 10);
  const manifest = [
    '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>',
    '<item id="css" href="styles/book.css" media-type="text/css"/>',
    '<item id="cover-image" href="images/cover.svg" media-type="image/svg+xml" properties="cover-image"/>',
    '<item id="cover" href="text/cover.xhtml" media-type="application/xhtml+xml"/>',
    '<item id="front" href="text/front.xhtml" media-type="application/xhtml+xml"/>',
    ...pageFiles.map((file, index) => `<item id="p${index + 1}" href="text/${file}" media-type="application/xhtml+xml"/>`),
    '<item id="back" href="text/back.xhtml" media-type="application/xhtml+xml"/>',
  ].join('\n    ');
  const spine = [
    '<itemref idref="cover" linear="yes"/>',
    '<itemref idref="front" linear="yes"/>',
    '<itemref idref="nav" linear="yes"/>',
    ...pages.map((_, index) => `<itemref idref="p${index + 1}" linear="yes"/>`),
    '<itemref idref="back" linear="yes"/>',
  ].join('\n    ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="ar" prefix="schema: http://schema.org/">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${esc(identifier)}</dc:identifier>
    <dc:title id="title-ar" xml:lang="ar">${esc(titleAr)}</dc:title>
    <dc:title id="title-en" xml:lang="en">${esc(titleEn)}</dc:title>
    <dc:language>ar</dc:language>
    <dc:language>en</dc:language>
    <dc:creator id="creator">${esc(pick(document.metadata.author, 'ar'))}</dc:creator>
    <meta refines="#creator" property="role" scheme="marc:relators">aut</meta>
    <dc:publisher>${esc(document.metadata.publisher)}</dc:publisher>
    <dc:date>${esc(date)}</dc:date>
    <dc:rights>${esc(`${document.metadata.rights.holder} — ${document.metadata.rights.license}`)}</dc:rights>
    <dc:description xml:lang="ar">${esc(pick(document.metadata.subtitle, 'ar'))}</dc:description>
    <dc:description xml:lang="en">${esc(pick(document.metadata.subtitle, 'en'))}</dc:description>
    ${subjects}
    <meta property="dcterms:modified">${esc(modified)}</meta>
    <meta property="schema:accessMode">textual</meta>
    <meta property="schema:accessModeSufficient">textual</meta>
    <meta property="schema:accessibilityFeature">structuralNavigation</meta>
    <meta property="schema:accessibilityFeature">tableOfContents</meta>
    <meta property="schema:accessibilityHazard">none</meta>
    <meta property="schema:accessibilitySummary" xml:lang="en">Bilingual Arabic/English text with structural navigation and a table of contents. No audio, video or timed content.</meta>
    <meta name="cover" content="cover-image"/>
  </metadata>
  <manifest>
    ${manifest}
  </manifest>
  <spine toc="ncx" page-progression-direction="rtl">
    ${spine}
  </spine>
</package>
`;
}

const CONTAINER = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
`;

/* ------------------------------------------------------------------ */
/* public API                                                          */
/* ------------------------------------------------------------------ */

export function edbToEpub(document: EdbDocument, options: EpubOptions = {}): EpubBuild {
  const warnings: string[] = [];
  const modified = (options.modified || DEFAULT_MODIFIED).replace(/\.\d{3}Z$/, 'Z');
  const ctx: Context = {
    document,
    warnings,
    sources: new Map(),
    webAppUrl: options.webAppUrl || DEFAULT_WEB_APP,
  };
  const pages = [...document.pages].sort((a, b) => a.number - b.number);
  const pageFiles = pages.map((_, index) => `p${String(index + 1).padStart(3, '0')}.xhtml`);
  const identifier = `urn:uuid:${uuidFor(`insco:${document.id}:${document.metadata.edition}`)}`;

  const entries: ZipInput[] = [];
  const add = (path: string, content: string | Buffer) => {
    entries.push({ path, data: typeof content === 'string' ? Buffer.from(content, 'utf8') : content });
  };

  add('mimetype', 'application/epub+zip');
  add('META-INF/container.xml', CONTAINER);
  add('OEBPS/content.opf', opfDocument(document, pages, pageFiles, identifier, modified));
  add('OEBPS/nav.xhtml', navDocument(document, pages, pageFiles));
  add('OEBPS/toc.ncx', ncxDocument(document, document.chapters.map(chapter => {
    const index = chapter.pageIds.map(id => pages.findIndex(page => page.id === id)).find(position => position >= 0) ?? 0;
    return { title: chapter.title, file: `text/${pageFiles[index] || 'front.xhtml'}` };
  }), identifier));
  add('OEBPS/styles/book.css', stylesheet(document));
  add('OEBPS/images/cover.svg', coverSvg(document));
  add('OEBPS/text/cover.xhtml', coverPage(document));
  add('OEBPS/text/front.xhtml', frontMatter(document, pages.length));
  pages.forEach((page, index) => {
    add(`OEBPS/text/${pageFiles[index]}`, pageDocument(document, page, ctx, index, pages.length));
  });
  add('OEBPS/text/back.xhtml', backMatter(document, ctx));

  const buffer = writeZip(entries);
  const file = `${document.id.replace(/^edb-/, '')}.epub`;
  const kind: 'textbook' | 'course' = document.metadata.relatedLevel ? 'course' : 'textbook';
  const entry: EpubIndexEntry = {
    id: document.id,
    file,
    kind,
    title: document.metadata.title,
    subtitle: document.metadata.subtitle,
    discipline: document.metadata.relatedDiscipline || 'general',
    pages: pages.length,
    languages: ['ar', 'en'],
    bytes: buffer.length,
    checksum: zipContentDigest(entries),
    untranslated: countSingleLanguage(document),
    modified,
  };

  return { id: document.id, file, kind, buffer, entries, warnings, pages: pages.length, title: document.metadata.title, entry };
}

export { esc as escapeXml };
