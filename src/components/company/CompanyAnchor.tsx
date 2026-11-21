import { useEffect } from 'react';

/** Route anchors can arrive after nested Suspense boundaries commit. */
export function CompanyAnchor({ id }: { id?: string }) {
  useEffect(() => {
    if (!id) return;
    let frame = 0;
    let observer: MutationObserver | undefined;
    const jump = () => {
      const target = document.getElementById(id);
      if (!target) return false;
      observer?.disconnect();
      const scroll = () => target.scrollIntoView?.({ block: 'start', behavior: 'instant' });
      if (typeof window.requestAnimationFrame === 'function') frame = window.requestAnimationFrame(scroll);
      else scroll();
      return true;
    };
    if (!jump() && typeof window.MutationObserver === 'function') {
      observer = new window.MutationObserver(jump);
      observer.observe(document.getElementById('insco-main') ?? document.body, { childList: true, subtree: true });
    }
    return () => {
      observer?.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [id]);
  return null;
}
