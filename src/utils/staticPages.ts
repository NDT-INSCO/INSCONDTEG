// Vite marks Pages builds even when a custom domain has base '/'. The hosted
// build and dev server have a same-origin API; static Pages does not.
declare const __INSCO_STATIC_PAGES__: boolean;

export function isStaticPages(): boolean {
  return (typeof __INSCO_STATIC_PAGES__ !== 'undefined' && __INSCO_STATIC_PAGES__) ||
    (typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io'));
}
