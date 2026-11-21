import { useEffect } from 'react';

/** Wait for the destination (including lazy children) to mount before jumping. */
export function CompanyAnchor({ id }: { id?: string }) {
  useEffect(() => {
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    const chrome = document.getElementById('site-chrome')?.getBoundingClientRect().height ?? 0;
    const top = target.getBoundingClientRect().top + window.scrollY - chrome - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  }, [id]);
  return null;
}
