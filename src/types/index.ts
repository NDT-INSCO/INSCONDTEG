/**
 * Backwards-compatible entry point.
 *
 * All application types now live in `src/types.ts`. This module only re-exports
 * them so any historical `import ... from '<path>/types'` keeps resolving to the
 * same schema instead of a second, drifting copy.
 */
export * from '../types';
