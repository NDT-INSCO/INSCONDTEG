import {
  EDB_MAX_BLOCKS_PER_PAGE,
  EDB_MAX_BYTES,
  EDB_MAX_PAGES,
  EDB_VERSION,
  EdbBlock,
  EdbDocument,
  EdbText,
  EdbValidationResult,
} from './types';

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Body text may be translated progressively: at least one language must be
 * present and both fields must be strings. Metadata requires both languages
 * (see `isFullyBilingual`).
 */
export const isEdbText = (value: unknown): value is EdbText => {
  if (!isObject(value)) return false;
  const ar = value.ar;
  const en = value.en;
  return (
    typeof ar === 'string' &&
    typeof en === 'string' &&
    (ar.trim().length > 0 || en.trim().length > 0)
  );
};

export const isFullyBilingual = (value: unknown): value is EdbText => {
  if (!isObject(value)) return false;
  return (
    typeof value.ar === 'string' &&
    typeof value.en === 'string' &&
    value.ar.trim().length > 0 &&
    value.en.trim().length > 0
  );
};

const isHexColour = (value: unknown) =>
  typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);

export const isSafeEdbUrl = (value: unknown): boolean => {
  if (typeof value !== 'string' || value.trim().length === 0) return false;
  try {
    const url = new URL(value, 'https://local.invalid/');
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
};

const blockError = (page: number, index: number, message: string) =>
  `pages[${page}].blocks[${index}]: ${message}`;

function validateBlock(block: unknown, pageIndex: number, blockIndex: number, errors: string[], warnings: string[]) {
  const prefix = blockError(pageIndex, blockIndex, '');
  if (!isObject(block)) {
    errors.push(`${prefix} block is not an object`);
    return;
  }
  switch (block.type) {
    case 'heading':
      if (![1, 2, 3].includes(block.level as number)) errors.push(`${prefix} heading.level must be 1..3`);
      if (!isEdbText(block.text)) errors.push(`${prefix} heading.text must be bilingual and non-empty`);
      return;
    case 'paragraph':
      if (!isEdbText(block.text)) errors.push(`${prefix} paragraph.text must be bilingual and non-empty`);
      return;
    case 'list':
      if (!Array.isArray(block.items) || block.items.length === 0) errors.push(`${prefix} list.items must be non-empty`);
      else block.items.forEach((item, i) => { if (!isEdbText(item)) errors.push(`${prefix} list.items[${i}] must be bilingual`); });
      if (typeof block.ordered !== 'boolean') errors.push(`${prefix} list.ordered must be boolean`);
      return;
    case 'formula':
      if (typeof block.expression !== 'string' || block.expression.trim().length === 0) errors.push(`${prefix} formula.expression is required`);
      if (block.caption !== undefined && !isEdbText(block.caption)) errors.push(`${prefix} formula.caption must be bilingual when present`);
      return;
    case 'callout':
      if (!['info', 'warning', 'success'].includes(block.tone as string)) errors.push(`${prefix} callout.tone is invalid`);
      if (!isEdbText(block.text)) errors.push(`${prefix} callout.text must be bilingual`);
      if (block.title !== undefined && !isEdbText(block.title)) errors.push(`${prefix} callout.title must be bilingual when present`);
      return;
    case 'quiz': {
      if (typeof block.id !== 'string' || !block.id.trim()) errors.push(`${prefix} quiz.id is required`);
      if (!isEdbText(block.question)) errors.push(`${prefix} quiz.question must be bilingual`);
      if (!Array.isArray(block.options) || block.options.length < 2) errors.push(`${prefix} quiz.options needs at least two entries`);
      else block.options.forEach((option, i) => { if (!isEdbText(option)) errors.push(`${prefix} quiz.options[${i}] must be bilingual`); });
      if (typeof block.answer !== 'number' || !Number.isInteger(block.answer)) errors.push(`${prefix} quiz.answer must be an integer`);
      else if (Array.isArray(block.options) && (block.answer < 0 || block.answer >= block.options.length)) errors.push(`${prefix} quiz.answer is outside options`);
      if (!isEdbText(block.explanation)) errors.push(`${prefix} quiz.explanation must be bilingual`);
      return;
    }
    case 'experiment':
      if (typeof block.experimentId !== 'string' || !block.experimentId.trim()) errors.push(`${prefix} experiment.experimentId is required`);
      if (!isEdbText(block.label)) errors.push(`${prefix} experiment.label must be bilingual`);
      return;
    case 'source':
      if (typeof block.title !== 'string' || !block.title.trim()) errors.push(`${prefix} source.title is required`);
      if (!isSafeEdbUrl(block.url)) errors.push(`${prefix} source.url must be http(s)`);
      if (typeof block.url === 'string' && /^http:\/\//i.test(block.url)) warnings.push(`${prefix} source.url uses plain HTTP`);
      return;
    case 'image':
      if (typeof block.src !== 'string' || !block.src.trim()) errors.push(`${prefix} image.src is required`);
      if (!isEdbText(block.alt)) errors.push(`${prefix} image.alt must be bilingual`);
      return;
    default:
      errors.push(`${prefix} unsupported block type "${String(block.type)}"`);
  }
}

export function validateEdb(input: unknown): EdbValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isObject(input)) return { valid: false, errors: ['Document must be a JSON object'], warnings };
  if (input.format !== 'EDB') errors.push('format must be "EDB"');
  if (input.version !== EDB_VERSION) errors.push(`version must be "${EDB_VERSION}"`);
  if (typeof input.id !== 'string' || !/^[a-z0-9][a-z0-9-]{2,80}$/i.test(input.id)) {
    errors.push('id must be 3..80 URL-safe characters');
  }

  const metadata = input.metadata;
  if (!isObject(metadata)) {
    errors.push('metadata is required');
  } else {
    if (!isFullyBilingual(metadata.title)) errors.push('metadata.title must be fully bilingual');
    if (!isFullyBilingual(metadata.subtitle)) errors.push('metadata.subtitle must be fully bilingual');
    if (!isFullyBilingual(metadata.author)) errors.push('metadata.author must be fully bilingual');
    if (typeof metadata.publisher !== 'string') errors.push('metadata.publisher is required');
    if (typeof metadata.edition !== 'string') errors.push('metadata.edition is required');
    if (typeof metadata.createdAt !== 'string' || Number.isNaN(Date.parse(metadata.createdAt))) errors.push('metadata.createdAt must be an ISO date');
    if (typeof metadata.updatedAt !== 'string' || Number.isNaN(Date.parse(metadata.updatedAt))) errors.push('metadata.updatedAt must be an ISO date');
    if (!Array.isArray(metadata.languages) || !metadata.languages.length || metadata.languages.some(l => l !== 'ar' && l !== 'en')) {
      errors.push('metadata.languages must include ar and/or en');
    }
    if (!['rtl', 'ltr', 'auto'].includes(metadata.readingDirection as string)) errors.push('metadata.readingDirection is invalid');
    if (typeof metadata.estimatedMinutes !== 'number' || metadata.estimatedMinutes <= 0) errors.push('metadata.estimatedMinutes must be positive');
    if (!Array.isArray(metadata.keywords) || metadata.keywords.some(k => !isFullyBilingual(k))) errors.push('metadata.keywords must be bilingual entries');
    if (!isObject(metadata.rights)) errors.push('metadata.rights is required');
    else {
      if (typeof metadata.rights.holder !== 'string') errors.push('metadata.rights.holder is required');
      if (typeof metadata.rights.license !== 'string') errors.push('metadata.rights.license is required');
      if (!isFullyBilingual(metadata.rights.notice)) errors.push('metadata.rights.notice must be fully bilingual');
    }
    if (metadata.sourceNote !== undefined && !isFullyBilingual(metadata.sourceNote)) errors.push('metadata.sourceNote must be fully bilingual when present');
    if (metadata.standards !== undefined && (!Array.isArray(metadata.standards) || metadata.standards.some(s => typeof s !== 'string'))) {
      errors.push('metadata.standards must be a list of strings when present');
    }
  }

  const theme = input.theme;
  if (!isObject(theme)) errors.push('theme is required');
  else {
    for (const key of ['accent', 'accentSoft', 'ink', 'paper'] as const) {
      if (!isHexColour(theme[key])) errors.push(`theme.${key} must be a hex colour`);
    }
    if (!isFullyBilingual(theme.label)) errors.push('theme.label must be fully bilingual');
  }

  if (!Array.isArray(input.pages) || input.pages.length === 0) {
    errors.push('pages must be a non-empty array');
    return { valid: false, errors, warnings };
  }
  if (input.pages.length > EDB_MAX_PAGES) errors.push(`pages exceeds ${EDB_MAX_PAGES}`);

  const pageIds = new Set<string>();
  const chapterIds = new Set<string>();
  const quizIds = new Set<string>();

  if (!Array.isArray(input.chapters) || input.chapters.length === 0) errors.push('chapters must be a non-empty array');
  if (Array.isArray(input.chapters)) {
    input.chapters.forEach((chapter, i) => {
      if (!isObject(chapter)) {
        errors.push(`chapters[${i}] must be an object`);
        return;
      }
      if (typeof chapter.id !== 'string' || !chapter.id.trim()) errors.push(`chapters[${i}].id is required`);
      else if (chapterIds.has(chapter.id)) errors.push(`chapters[${i}].id is duplicated`);
      else chapterIds.add(chapter.id);
      if (!isEdbText(chapter.title)) errors.push(`chapters[${i}].title must be bilingual`);
      if (!Array.isArray(chapter.pageIds) || chapter.pageIds.length === 0) errors.push(`chapters[${i}].pageIds must be non-empty`);
    });
  }

  input.pages.forEach((page, i) => {
    if (!isObject(page)) {
      errors.push(`pages[${i}] must be an object`);
      return;
    }
    if (typeof page.id !== 'string' || !page.id.trim()) errors.push(`pages[${i}].id is required`);
    else if (pageIds.has(page.id)) errors.push(`pages[${i}].id is duplicated`);
    else pageIds.add(page.id);
    if (page.number !== i + 1) errors.push(`pages[${i}].number must equal ${i + 1}`);
    if (typeof page.chapterId !== 'string') errors.push(`pages[${i}].chapterId is required`);
    else if (Array.isArray(input.chapters) && !chapterIds.has(page.chapterId)) errors.push(`pages[${i}].chapterId does not exist`);
    if (!['cover', 'content', 'chapter', 'assessment', 'summary'].includes(page.kind as string)) errors.push(`pages[${i}].kind is invalid`);
    if (!isEdbText(page.title)) errors.push(`pages[${i}].title must contain text`);
    if (!Array.isArray(page.blocks) || page.blocks.length === 0) errors.push(`pages[${i}].blocks must be non-empty`);
    else {
      if (page.blocks.length > EDB_MAX_BLOCKS_PER_PAGE) errors.push(`pages[${i}].blocks exceeds ${EDB_MAX_BLOCKS_PER_PAGE}`);
      page.blocks.forEach((block, j) => validateBlock(block, i, j, errors, warnings));
      page.blocks.forEach((block, j) => {
        if (isObject(block) && block.type === 'quiz' && typeof block.id === 'string') {
          if (quizIds.has(block.id)) errors.push(blockError(i, j, `quiz.id "${block.id}" is duplicated`));
          quizIds.add(block.id);
        }
      });
    }
    if (page.estimatedMinutes !== undefined && (typeof page.estimatedMinutes !== 'number' || page.estimatedMinutes <= 0)) {
      errors.push(`pages[${i}].estimatedMinutes must be positive when present`);
    }
    if (Array.isArray(page.blocks) && page.blocks.length < 2) warnings.push(`pages[${i}] has very little content`);
  });

  if (Array.isArray(input.chapters)) {
    input.chapters.forEach((chapter, i) => {
      if (!isObject(chapter) || !Array.isArray(chapter.pageIds)) return;
      chapter.pageIds.forEach((id, j) => {
        if (typeof id !== 'string' || !pageIds.has(id)) errors.push(`chapters[${i}].pageIds[${j}] does not reference a page`);
      });
    });
    const referenced = new Set(input.chapters.flatMap(c => (isObject(c) && Array.isArray(c.pageIds) ? c.pageIds : [])));
    input.pages.forEach((page, i) => {
      if (isObject(page) && typeof page.id === 'string' && !referenced.has(page.id)) {
        warnings.push(`pages[${i}] is not listed in any chapter`);
      }
    });
  }

  if (input.glossary !== undefined) {
    if (!Array.isArray(input.glossary)) errors.push('glossary must be an array when present');
    else input.glossary.forEach((entry, i) => {
      if (!isObject(entry) || !isEdbText(entry.term) || !isEdbText(entry.definition)) errors.push(`glossary[${i}] must have bilingual term and definition`);
    });
  }

  if (typeof input.generator !== 'string') errors.push('generator is required');

  return { valid: errors.length === 0, errors, warnings };
}

export type EdbBlockList = EdbBlock[];

export function parseEdb(raw: string): { document: EdbDocument | null; result: EdbValidationResult } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return { document: null, result: { valid: false, errors: ['Empty EDB payload'], warnings } };
  }
  if (raw.length > EDB_MAX_BYTES) {
    return { document: null, result: { valid: false, errors: [`EDB payload exceeds ${EDB_MAX_BYTES} characters`], warnings } };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { document: null, result: { valid: false, errors: ['EDB payload is not valid JSON'], warnings } };
  }
  const result = validateEdb(parsed);
  return result.valid ? { document: parsed as EdbDocument, result } : { document: null, result };
}

/** Deterministic serialisation (sorted object keys) used for checksums and file output. */
export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function countQuizzes(document: EdbDocument): number {
  return document.pages.reduce(
    (total, page) => total + page.blocks.filter(block => block.type === 'quiz').length,
    0
  );
}

export function documentText(document: EdbDocument): string {
  const parts: string[] = [document.metadata.title.ar, document.metadata.title.en, document.metadata.subtitle.ar, document.metadata.subtitle.en];
  document.pages.forEach(page => {
    parts.push(page.title.ar, page.title.en);
    page.blocks.forEach(block => {
      if ('text' in block && block.text) parts.push(block.text.ar, block.text.en);
      if (block.type === 'list') block.items.forEach(item => parts.push(item.ar, item.en));
      if (block.type === 'quiz') parts.push(block.question.ar, block.question.en, block.explanation.ar, block.explanation.en);
      if (block.type === 'formula') parts.push(block.expression);
      if (block.type === 'source') parts.push(block.title);
    });
  });
  return parts.join('\n');
}
