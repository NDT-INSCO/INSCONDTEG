import { createHash } from 'node:crypto';
import type { EdbDocument } from './types';
import { stableStringify } from './validate';

/** SHA-256 of an EDB edition, excluding its build-time timestamps. Node only. */
export function edbContentChecksum(document: EdbDocument): string {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...metadata } = document.metadata;
  return createHash('sha256').update(stableStringify({ ...document, metadata })).digest('hex');
}
