import React, { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { readPublicAnnouncement } from '../../admin/public';
import type { Language, LocalizedText } from '../../types';

export function CompanyAnnouncement({ language }: { language: Language }) {
  const [message, setMessage] = useState<LocalizedText | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void readPublicAnnouncement(controller.signal).then(result => {
      if (!controller.signal.aborted) setMessage(result);
    });
    return () => controller.abort();
  }, []);

  if (!message?.[language]) return null;
  return (
    <aside aria-label={language === 'ar' ? 'إعلان الموقع' : 'Site announcement'} className="border-b border-amber-500/30 bg-slate-900">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 text-sm font-semibold text-slate-100 sm:px-6">
        <Megaphone className="mt-0.5 size-4 shrink-0 text-amber-400" aria-hidden="true" />
        <p className="min-w-0 whitespace-pre-line break-words [overflow-wrap:anywhere]">{message[language]}</p>
      </div>
    </aside>
  );
}
