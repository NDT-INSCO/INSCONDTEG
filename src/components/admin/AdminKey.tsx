import React from 'react';
import { KeyRound } from 'lucide-react';
import { ADMIN_HASH } from '../../admin/contract';
import { externalAdminLink } from '../../admin/public';
import type { Language } from '../../types';

export function AdminKey({ language, onOpen, highlighted = false }: { language: Language; onOpen?: () => void; highlighted?: boolean }) {
  const label = language === 'ar' ? 'بوابة الإدارة' : 'Admin portal';
  const external = externalAdminLink();
  return (
    <a
      href={external ?? ADMIN_HASH}
      aria-label={label}
      title={label}
      onClick={event => {
        if (!onOpen || external || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        onOpen();
      }}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-lg border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 ${
        highlighted
          ? 'border-amber-500/45 bg-amber-500/10 text-amber-400 hover:border-amber-400 hover:bg-amber-500/20'
          : 'border-transparent text-slate-400 hover:border-slate-700 hover:bg-slate-800 hover:text-amber-400'
      }`}
    >
      <KeyRound className="size-4" aria-hidden="true" />
    </a>
  );
}
