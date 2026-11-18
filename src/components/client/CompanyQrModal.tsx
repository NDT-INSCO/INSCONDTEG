import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  QrCode,
  X,
} from 'lucide-react';
import type { Language } from '../../types';
import {
  buildCompanyDossierUrl,
  exportCompanyQrPassPdf,
  generateCompanyQrPngDataUrl,
  type CompanyQrPassTarget,
} from '../../client/companyQr';
import { useEscapeKey } from '../../utils/a11y';
import { CompanyQrBadge } from './CompanyQrBadge';

interface CompanyQrModalProps {
  language: Language;
  company: CompanyQrPassTarget;
  onClose: () => void;
  onOpenDossier?: (companyId: string) => void;
}

export const CompanyQrModal: React.FC<CompanyQrModalProps> = ({
  language,
  company,
  onClose,
  onOpenDossier,
}) => {
  const isAr = language === 'ar';
  useEscapeKey(true, onClose);

  const dossierUrl = buildCompanyDossierUrl(company.id);
  const [copied, setCopied] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard?.writeText(dossierUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard permission denied in headless browser */
    }
  };

  const handleDownloadPng = async () => {
    setDownloadingPng(true);
    try {
      const dataUrl = await generateCompanyQrPngDataUrl(company.id, 640);
      const anchor = document.createElement('a');
      const slug = (company.companyCode || company.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      anchor.href = dataUrl;
      anchor.download = `INSCO_QR_${slug}.png`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } finally {
      setDownloadingPng(false);
    }
  };

  const displayName = isAr
    ? company.nameAr || company.nameEn || company.id
    : company.nameEn || company.nameAr || company.id;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
      role="presentation"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={isAr ? 'إغلاق النافذة' : 'Close dialog'}
        onClick={onClose}
        className="absolute inset-0 w-full h-full cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={
          isAr
            ? `بطاقة الوصول السريع QR للشركة ${displayName}`
            : `Field Inspector QR Pass for ${displayName}`
        }
        dir={isAr ? 'rtl' : 'ltr'}
        className="relative z-10 w-full max-w-md rounded-xl border border-slate-700 bg-slate-950 p-6 space-y-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-emerald-400">
              <QrCode className="w-3.5 h-3.5" aria-hidden="true" />
              <span>
                {isAr ? 'بطاقة الوصول الميداني للمفتشين' : 'Field Inspector Dossier QR Pass'}
              </span>
            </div>
            <h3 className="text-base font-black text-white mt-1">{displayName}</h3>
            <div className="text-[11px] font-mono text-slate-400 mt-0.5 tabular-nums flex flex-wrap items-center gap-2">
              {company.companyCode && (
                <span className="text-cyan-300 font-bold">{company.companyCode}</span>
              )}
              {company.companyCode && <span aria-hidden="true">·</span>}
              <span>ID: {company.id}</span>
            </div>
          </div>

          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label={isAr ? 'إغلاق بطاقة QR' : 'Close QR modal'}
            className="rounded-lg border border-slate-700 p-1.5 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 py-1">
          <CompanyQrBadge
            companyId={company.id}
            companyName={displayName}
            sizePx={200}
          />
          <p className="text-xs text-slate-400 text-center max-w-xs leading-relaxed">
            {isAr
              ? 'امسح الكود بكاميرا الهاتف أو التابلت لفتح فايل الشركة وملف الريبورتات مباشرةً في الموقع.'
              : 'Scan with any phone or tablet camera to open this company’s file and inspection report dossier directly.'}
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 flex items-center justify-between gap-2">
          <span
            dir="ltr"
            className="font-mono text-[11px] text-slate-300 truncate select-all"
          >
            {dossierUrl}
          </span>
          <button
            type="button"
            onClick={() => void handleCopyUrl()}
            className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-slate-800 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                <span>{isAr ? 'تم النسخ' : 'Copied'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" aria-hidden="true" />
                <span>{isAr ? 'نسخ الرابط' : 'Copy URL'}</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={downloadingPng}
            onClick={() => void handleDownloadPng()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2.5 text-xs font-bold text-slate-100 transition cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
            <span>{isAr ? 'تحميل صورة QR (PNG)' : 'Download QR (PNG)'}</span>
          </button>

          <button
            type="button"
            onClick={() => exportCompanyQrPassPdf(company)}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2.5 text-xs font-bold text-amber-300 transition cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'بطاقة PDF للطباعة' : 'Printable Pass PDF'}</span>
          </button>
        </div>

        {onOpenDossier && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenDossier(company.id);
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-black text-white transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {isAr ? 'فتح فايل الشركة والريبورتات الآن' : 'Open Company File & Dossier Now'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
