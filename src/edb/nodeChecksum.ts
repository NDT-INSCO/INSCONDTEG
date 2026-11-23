import { createHash } from 'node:crypto';
import type { EdbDocument } from './types.js';
import { stableStringify } from './validate.js';

/** SHA-256 of an EDB edition, excluding its build-time timestamps. Node only. */
export function edbContentChecksum(document: EdbDocument): string {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...metadata } = document.metadata;
  return createHash('sha256').update(stableStringify({ ...document, metadata })).digest('hex');
}
