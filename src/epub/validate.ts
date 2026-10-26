/// <reference types="node" />
/**
 * Offline EPUB 3 structural validator.
 *
 * It is not a replacement for epubcheck (which needs Java and a network for
 * its schemas). It enforces the rules that actually break readers and that we
 * can prove locally:
 *
 *   - `mimetype` first, stored, exact bytes
 *   - `META-INF/container.xml` resolves to a real package document
 *   - unique identifier consistent between package and dc:identifier
 *   - every manifest item and spine itemref resolves
 *   - the navigation document exists and contains a `toc` nav
 *   - no remote resources and no scripted content
 *   - every XHTML document is well-formed XML and its internal links resolve
 */
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { readZip, ZipEntry } from './zip';

export interface EpubValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  pages: number;
  documents: number;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  allowBooleanAttributes: true,
  trimValues: false,
});

type Node = Record<string, unknown>;

function asArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function node(value: unknown): Node {
  return value && typeof value === 'object' ? (value as Node) : {};
}

function textOf(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  const raw = node(value)['#text'];
  return typeof raw === 'string' || typeof raw === 'number' ? String(raw) : '';
}

function attr(value: unknown, name: string): string {
  const raw = node(value)[`@_${name}`];
  return typeof raw === 'string' ? raw : '';
}

function normalize(base: string, href: string): string {
  const clean = href.split('#')[0].split('?')[0];
  const parts = `${base ? `${base}/` : ''}${clean}`.split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') stack.pop();
    else stack.push(part);
  }
  return stack.join('/');
}

function dirOf(path: string): string {
  const index = path.lastIndexOf('/');
  return index < 0 ? '' : path.slice(0, index);
}

function isExternal(href: string): boolean {
  return /^(https?:|mailto:|tel:|data:)/i.test(href);
}

function xmlCheck(xml: string, label: string, errors: string[]): Node | null {
  const result = XMLValidator.validate(xml);
  if (result !== true) {
    errors.push(`${label} is not well-formed XML: ${result.err.msg} (line ${result.err.line})`);
    return null;
  }
  try {
    return node(parser.parse(xml));
  } catch (error) {
    errors.push(`${label} could not be parsed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function collectLinks(xml: string): string[] {
  const links = new Set<string>();
  for (const match of xml.matchAll(/(?:href|src)="([^"]+)"/g)) {
    links.add(match[1]);
  }
  return [...links];
}

export function validateEpub(buffer: Buffer): EpubValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  let entries: ZipEntry[];
  try {
    entries = readZip(buffer);
  } catch (error) {
    return {
      valid: false,
      errors: [`not a readable ZIP: ${error instanceof Error ? error.message : String(error)}`],
      warnings,
      pages: 0,
      documents: 0,
    };
  }

  const byPath = new Map(entries.map(entry => [entry.path, entry]));

  // 1. mimetype
  const first = entries[0];
  if (!first || first.path !== 'mimetype') {
    errors.push('mimetype must be the first entry in the archive');
  } else {
    if (first.method !== 0) errors.push('mimetype must be stored (method 0), not compressed');
    if (first.data.toString('utf8') !== 'application/epub+zip') {
      errors.push('mimetype content must be exactly "application/epub+zip"');
    }
    if (first.uncompressedSize !== 20) errors.push('mimetype must not carry padding');
  }

  // 2. container
  const container = byPath.get('META-INF/container.xml');
  if (!container) {
    return { valid: false, errors: [...errors, 'META-INF/container.xml is missing'], warnings, pages: 0, documents: 0 };
  }
  const containerRoot = xmlCheck(container.data.toString('utf8'), 'META-INF/container.xml', errors);
  const rootfile = node(node(node(containerRoot).container).rootfiles).rootfile;
  const opfPath = attr(asArray(rootfile)[0], 'full-path');
  if (!opfPath) {
    return { valid: false, errors: [...errors, 'container.xml declares no rootfile'], warnings, pages: 0, documents: 0 };
  }
  const opfEntry = byPath.get(opfPath);
  if (!opfEntry) {
    return { valid: false, errors: [...errors, `package document not found: ${opfPath}`], warnings, pages: 0, documents: 0 };
  }
  if (attr(asArray(rootfile)[0], 'media-type') !== 'application/oebps-package+xml') {
    errors.push('rootfile media-type must be application/oebps-package+xml');
  }

  const opf = xmlCheck(opfEntry.data.toString('utf8'), opfPath, errors);
  if (!opf) return { valid: false, errors, warnings, pages: 0, documents: 0 };

  const pkg = node(opf.package);
  if (attr(pkg, 'version') !== '3.0') errors.push(`package version must be "3.0" (found "${attr(pkg, 'version')}")`);
  const opfDir = dirOf(opfPath);

  // 3. metadata
  const metadata = node(pkg.metadata);
  const identifiers = asArray(metadata['dc:identifier']).map(item => ({ id: attr(item, 'id'), text: textOf(item) }));
  const uniqueId = attr(pkg, 'unique-identifier');
  const primary = identifiers.find(item => item.id === uniqueId);
  if (!primary || !primary.text.trim()) {
    errors.push(`unique-identifier "${uniqueId}" does not match any dc:identifier`);
  } else if (!/^urn:uuid:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(primary.text.trim())) {
    warnings.push(`dc:identifier "${primary.text.trim()}" is not a UUID URN`);
  }
  const titles = asArray(metadata['dc:title']);
  if (titles.length === 0) errors.push('dc:title is missing');
  const languages = asArray(metadata['dc:language']).map(textOf);
  if (languages.length === 0) errors.push('dc:language is missing');
  if (languages.some(language => !/^[a-zA-Z]{2,3}(-[a-zA-Z0-9]+)?$/.test(language))) {
    errors.push(`dc:language must be a BCP-47 tag (found "${languages.join(', ')}")`);
  }
  const metas = asArray(metadata.meta);
  const modified = metas.find(item => attr(item, 'property') === 'dcterms:modified');
  const modifiedText = modified ? textOf(modified).trim() : '';
  if (!modifiedText) {
    errors.push('meta property="dcterms:modified" is required');
  } else if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(modifiedText)) {
    errors.push(`dcterms:modified must be CCYY-MM-DDThh:mm:ssZ (found "${modifiedText}")`);
  }

  // 4. manifest
  const manifestNode = node(pkg.manifest);
  const items = asArray(manifestNode.item);
  if (items.length === 0) errors.push('manifest is empty');
  const itemById = new Map<string, { href: string; mediaType: string; properties: string }>();
  const referenced = new Set<string>();
  for (const item of items) {
    const id = attr(item, 'id');
    const href = attr(item, 'href');
    const mediaType = attr(item, 'media-type');
    const properties = attr(item, 'properties');
    if (!id) errors.push('manifest item without id');
    if (!href) errors.push(`manifest item "${id}" has no href`);
    if (!mediaType) errors.push(`manifest item "${id}" has no media-type`);
    if (itemById.has(id)) errors.push(`duplicate manifest id "${id}"`);
    if (isExternal(href)) errors.push(`remote resource in manifest: ${href}`);
    if (/javascript/i.test(mediaType)) errors.push(`scripted content is not allowed: ${href}`);
    const path = normalize(opfDir, href);
    referenced.add(path);
    if (!byPath.has(path)) errors.push(`manifest item "${id}" points at a missing file: ${href}`);
    itemById.set(id, { href: path, mediaType, properties });
  }
  const navItem = items.find(item => attr(item, 'properties').split(/\s+/).includes('nav'));
  if (!navItem) errors.push('manifest has no item with properties="nav"');

  // 5. spine
  const spine = node(pkg.spine);
  const itemrefs = asArray(spine.itemref);
  if (itemrefs.length === 0) errors.push('spine is empty');
  for (const itemref of itemrefs) {
    const idref = attr(itemref, 'idref');
    if (!itemById.has(idref)) errors.push(`spine references unknown manifest id "${idref}"`);
  }
  const spineOrder = itemrefs.map(itemref => itemById.get(attr(itemref, 'idref'))?.href).filter(Boolean) as string[];
  if (!spineOrder.some(path => path.endsWith('.xhtml'))) errors.push('spine has no XHTML content document');

  // 6. navigation document
  if (navItem) {
    const navPath = normalize(opfDir, attr(navItem, 'href'));
    const navEntry = byPath.get(navPath);
    if (navEntry) {
      const navXml = navEntry.data.toString('utf8');
      if (!/epub:type\s*=\s*"toc"/.test(navXml)) errors.push('navigation document has no <nav epub:type="toc">');
      if (!/<h1[\s>]/.test(navXml)) warnings.push('navigation document has no <h1> heading');
    }
  }

  // 7. XHTML documents
  let documents = 0;
  for (const entry of entries) {
    if (!entry.path.endsWith('.xhtml') && !entry.path.endsWith('.htm')) continue;
    documents += 1;
    const xml = entry.data.toString('utf8');
    const parsed = xmlCheck(xml, entry.path, errors);
    if (!parsed) continue;
    const html = node(parsed.html);
    if (!parsed.html) errors.push(`${entry.path} has no <html> root element`);
    const head = node(html.head);
    const title = textOf(head.title);
    if (!title.trim()) errors.push(`${entry.path} has no <title>`);
    if (!/@_lang|xml:lang/.test(xml.slice(0, 400))) warnings.push(`${entry.path} declares no language on <html>`);
    for (const link of collectLinks(xml)) {
      if (link.startsWith('#') || isExternal(link)) continue;
      const target = normalize(dirOf(entry.path), link);
      if (!byPath.has(target)) errors.push(`${entry.path} links to a missing file: ${link}`);
    }
  }
  if (documents === 0) errors.push('archive contains no XHTML documents');

  // 8. unreferenced files
  for (const entry of entries) {
    if (entry.path === 'mimetype' || entry.path.startsWith('META-INF/')) continue;
    if (entry.path === opfPath) continue;
    if (!referenced.has(entry.path)) warnings.push(`file not listed in the manifest: ${entry.path}`);
  }

  const pages = spineOrder.filter(path => /\/p\d+\.xhtml$/.test(path)).length;
  return { valid: errors.length === 0, errors, warnings, pages, documents };
}
