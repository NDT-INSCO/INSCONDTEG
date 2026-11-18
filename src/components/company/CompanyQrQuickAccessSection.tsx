import React, { useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  ArrowUpRight,
  Building2,
  Check,
  Copy,
  Download,
  FileText,
  FolderOpen,
  LogIn,
  QrCode,
  Search,
} from 'lucide-react';
import type { Language } from '../../types';
import {
  buildCompanyDossierUrl,
  exportCompanyQrPassPdf,
  generateCompanyQrPngDataUrl,
  isValidCompanyIdSlug,
  sanitizeCompanyIdSlug,
  type CompanyQrPassTarget,
} from '../../client/companyQr';
import type { CompanyRecord } from '../../client/types';
import {
  isVerifiedAdminUser,
  observeClientPortalAuth,
  signInClientPortalWithGoogle,
  subscribeCompanies,
} from '../../client/firestoreClientService';
import { CompanyQrBadge } from '../client/CompanyQrBadge';
import { CompanyQrModal } from '../client/CompanyQrModal';

interface CompanyQrQuickAccessSectionProps {
  language: Language;
  onOpenCompanyDossier?: (companyId: string) => void;
  onOpenClientArchive?: () => void;
}

export const CompanyQrQuickAccessSection: React.FC<CompanyQrQuickAccessSectionProps> = ({
  language,
  onOpenCompanyDossier,
  onOpenClientArchive,
}) => {
  const isAr = language === 'ar';

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  const [manualCompanyId, setManualCompanyId] = useState('');
  const [directorySearch, setDirectorySearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [downloadingPng, setDownloadingPng] = useState(false);
  const [modalTarget, setModalTarget] = useState<CompanyQrPassTarget | null>(null);

  useEffect(() => {
    const unsub = observeClientPortalAuth(user => {
      setAuthUser(user);
    });
    return () => unsub();
  }, []);

  const isAdmin = useMemo(() => isVerifiedAdminUser(authUser), [authUser]);

  useEffect(() => {
    if (!authUser) {
      setCompanies([]);
      setCompaniesLoading(false);
      return;
    }
    setCompaniesLoading(true);
    const unsub = subscribeCompanies(
      authUser.uid,
      isAdmin,
      list => {
        setCompanies(list);
        setCompaniesLoading(false);
        setManualCompanyId(prev => prev || list[0]?.id || '');
      },
      err => {
        setCompaniesLoading(false);
        setAuthError(err.message);
      }
    );
    return () => unsub();
  }, [authUser, isAdmin]);

  const cleanInputId = useMemo(
    () => sanitizeCompanyIdSlug(manualCompanyId),
    [manualCompanyId]
  );

  const activeCompanyRecord = useMemo(
    () => companies.find(c => c.id === cleanInputId) ?? null,
    [companies, cleanInputId]
  );

  const isValidId = isValidCompanyIdSlug(cleanInputId);
  const activeQrTarget: CompanyQrPassTarget | null = useMemo(() => {
    if (!isValidId) return null;
    if (activeCompanyRecord) return activeCompanyRecord;
    return { id: cleanInputId };
  }, [isValidId, activeCompanyRecord, cleanInputId]);

  const activeDossierUrl = useMemo(
    () => (activeQrTarget ? buildCompanyDossierUrl(activeQrTarget.id) : ''),
    [activeQrTarget]
  );

  const filteredDirectory = useMemo(() => {
    const q = directorySearch.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter(
      co =>
        co.id.toLowerCase().includes(q) ||
        co.companyCode.toLowerCase().includes(q) ||
        co.nameAr.toLowerCase().includes(q) ||
        co.nameEn.toLowerCase().includes(q)
    );
  }, [companies, directorySearch]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setAuthError(null);
    try {
      await signInClientPortalWithGoogle();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : String(err));
    } finally {
      setSigningIn(false);
    }
  };

  const handleCopyLink = async () => {
    if (!activeDossierUrl) return;
    try {
      await navigator.clipboard?.writeText(activeDossierUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore clipboard denial in headless browsers */
    }
  };

  const handleDownloadPng = async () => {
    if (!activeQrTarget) return;
    setDownloadingPng(true);
    try {
      const dataUrl = await generateCompanyQrPngDataUrl(activeQrTarget.id, 640);
      const a = document.createElement('a');
      const slug = (activeQrTarget.companyCode || activeQrTarget.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      a.href = dataUrl;
      a.download = `INSCO_QR_${slug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloadingPng(false);
    }
  };

  const handleDirectJump = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidId) return;
    onOpenCompanyDossier?.(cleanInputId);
  };

  return (
    <section
      id="inspector-qr-access"
      aria-labelledby="inspector-qr-heading"
      className="py-16 border-t border-slate-800/80 bg-slate-950"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-emerald-400">
              <QrCode className="w-4 h-4" aria-hidden="true" />
              <span>
                {isAr
                  ? 'الوصول الميداني السريع عبر QR'
                  : 'Field Inspector QR Quick Access'}
              </span>
            </div>
            <h2
              id="inspector-qr-heading"
              className="text-2xl sm:text-3xl font-black text-white tracking-tight"
            >
              {isAr
                ? 'مولّد رموز QR لملفات الشركات وتقارير الفحص'
                : 'Unique Company ID QR Generator & Dossier Pass'}
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              {isAr
                ? 'توليد كود QR فريد لكل شركة مسجلة استناداً إلى معرّف الشركة الفردي (Company ID)، ليتمكن مفتشو الموقع من مسحه والوصول الفوري إلى ملف الشركة وسجل الريبورتات.'
                : 'Generates a unique scannable QR code keyed to each registered company’s individual ID, enabling field inspectors to jump straight to that company’s file and inspection report dossier.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {!authUser && (
              <button
                type="button"
                disabled={signingIn}
                onClick={() => void handleGoogleSignIn()}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2 text-xs font-bold text-emerald-300 transition cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {signingIn
                    ? isAr
                      ? 'جاري الاتصال...'
                      : 'Signing in...'
                    : isAr
                      ? 'دخول لتحميل الشركات المسجلة'
                      : 'Sign in for Registered Companies'}
                </span>
              </button>
            )}

            {onOpenClientArchive && (
              <button
                type="button"
                onClick={onOpenClientArchive}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 transition cursor-pointer whitespace-nowrap"
              >
                <FolderOpen className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                <span>
                  {isAr ? 'فتح بوابة أرشيف الشركات' : 'Open Client Archive'}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {authError && (
          <div
            role="alert"
            className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-300"
          >
            {authError}
          </div>
        )}

        {/* Primary Single-Elevation Workspace: Company ID Lookup + Live QR Preview */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: Company ID Entry & Actions */}
          <form onSubmit={handleDirectJump} className="lg:col-span-7 space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="inspector-company-id-input"
                className="block text-xs font-bold text-slate-200"
              >
                {isAr
                  ? 'المعرّف الفردي للشركة المسجلة (Individual Company ID)'
                  : 'Registered Individual Company ID'}
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  id="inspector-company-id-input"
                  type="text"
                  dir="ltr"
                  value={manualCompanyId}
                  onChange={e => setManualCompanyId(e.target.value)}
                  placeholder={
                    isAr
                      ? 'أدخل معرّف الشركة مثل comp_petrogulf_01...'
                      : 'Enter company ID (e.g. comp_petrogulf_01)...'
                  }
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 font-mono text-xs text-cyan-300 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none tabular-nums"
                />
                <button
                  type="submit"
                  disabled={!isValidId || !onOpenCompanyDossier}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 px-4 py-2.5 text-xs font-black text-white transition cursor-pointer whitespace-nowrap shrink-0"
                >
                  <FolderOpen className="w-4 h-4" aria-hidden="true" />
                  <span>
                    {isAr
                      ? 'فتح ملف الشركة والتقارير'
                      : 'Open File & Report Dossier'}
                  </span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                {isAr
                  ? 'يقبل الحروف اللاتينية والأرقام والشرطات (_ و -). يتحدث كود QR والرابط المباشر تلقائياً لكل معرّف.'
                  : 'Accepts alphanumeric characters, dashes, and underscores. QR matrix and deep-link update immediately per ID.'}
              </p>
            </div>

            {activeQrTarget && (
              <div className="space-y-3 pt-1">
                <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 flex items-center justify-between gap-2">
                  <span
                    dir="ltr"
                    className="font-mono text-[11px] text-slate-300 truncate select-all"
                  >
                    {activeDossierUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCopyLink()}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 hover:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 transition cursor-pointer whitespace-nowrap shrink-0"
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

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={downloadingPng}
                    onClick={() => void handleDownloadPng()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3 py-2 text-xs font-bold text-slate-100 transition cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
                    <span>{isAr ? 'تحميل صورة QR (PNG)' : 'Download QR (PNG)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => exportCompanyQrPassPdf(activeQrTarget)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-2 text-xs font-bold text-amber-300 transition cursor-pointer whitespace-nowrap"
                  >
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{isAr ? 'تصدير بطاقة المفتش PDF' : 'Export Inspector Pass PDF'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalTarget(activeQrTarget)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition cursor-pointer whitespace-nowrap"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                    <span>{isAr ? 'تكبير الكود' : 'Expand QR'}</span>
                  </button>
                </div>
              </div>
            )}
          </form>

          {/* Right: Live Scannable QR Preview */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-950 p-6 text-center space-y-3">
            {activeQrTarget ? (
              <>
                <CompanyQrBadge
                  companyId={activeQrTarget.id}
                  companyName={
                    activeCompanyRecord
                      ? isAr
                        ? activeCompanyRecord.nameAr
                        : activeCompanyRecord.nameEn
                      : undefined
                  }
                  sizePx={176}
                />
                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-white">
                    {activeCompanyRecord
                      ? isAr
                        ? activeCompanyRecord.nameAr
                        : activeCompanyRecord.nameEn
                      : isAr
                        ? 'بطاقة وصول ملف شركة'
                        : 'Company Dossier QR'}
                  </div>
                  <div className="text-[11px] font-mono text-cyan-300 tabular-nums">
                    {activeCompanyRecord?.companyCode
                      ? `${activeCompanyRecord.companyCode} · ID: ${activeQrTarget.id}`
                      : `ID: ${activeQrTarget.id}`}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-10 space-y-2.5 max-w-xs">
                <div className="mx-auto w-12 h-12 rounded-xl border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-400">
                  <QrCode className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="text-xs font-bold text-slate-200">
                  {isAr
                    ? 'أدخل معرّف الشركة لتوليد رمز QR الفوري'
                    : 'Enter a Company ID to generate its QR badge'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {isAr
                    ? 'أو اختر أي شركة مسجلة أدناه بعد تسجيل الدخول.'
                    : 'Or pick any registered company below once signed in.'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Registered Companies Live Firestore Directory (when signed in) */}
        {authUser && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white">
                  {isAr
                    ? 'بطاقات QR للشركات المسجلة في قاعدة البيانات'
                    : 'Registered Companies — Live Inspector QR Directory'}
                </h3>
                <p className="text-xs text-slate-400 tabular-nums">
                  {isAr
                    ? `الشركات المتاحة لحسابك: ${companies.length}`
                    : `Registered companies accessible to your account: ${companies.length}`}
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search
                  className={`w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 ${
                    isAr ? 'right-3' : 'left-3'
                  }`}
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={directorySearch}
                  onChange={e => setDirectorySearch(e.target.value)}
                  placeholder={
                    isAr
                      ? 'بحث بالمعرّف أو الكود أو الاسم...'
                      : 'Filter by ID, Code, or Name...'
                  }
                  className={`w-full rounded-lg border border-slate-700 bg-slate-900 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none ${
                    isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                  }`}
                />
              </div>
            </div>

            {companiesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(idx => (
                  <div
                    key={idx}
                    className="h-36 rounded-xl border border-slate-800 bg-slate-900/50 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredDirectory.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center text-xs text-slate-400">
                {isAr
                  ? 'لا توجد شركات مسجلة مرتبطة بهذا الحساب أو مطابقة لبحثك.'
                  : 'No registered companies match your filter for this account.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDirectory.map(co => (
                  <div
                    key={co.id}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex items-center gap-4"
                  >
                    <button
                      type="button"
                      onClick={() => setModalTarget(co)}
                      aria-label={
                        isAr ? `تكبير QR للشركة ${co.nameAr}` : `Expand QR for ${co.nameEn}`
                      }
                      className="shrink-0 cursor-pointer rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      <CompanyQrBadge
                        companyId={co.id}
                        companyName={isAr ? co.nameAr : co.nameEn}
                        sizePx={96}
                      />
                    </button>

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                        <span className="font-bold text-cyan-300 truncate">{co.companyCode}</span>
                        <span className="text-slate-400 shrink-0">
                          {co.reportsCount ?? 0} {isAr ? 'تقرير' : 'rpts'}
                        </span>
                      </div>

                      <div className="font-bold text-xs text-white flex items-center gap-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                        <span className="truncate">{isAr ? co.nameAr : co.nameEn}</span>
                      </div>

                      <div
                        dir="ltr"
                        className="text-[11px] font-mono text-slate-400 truncate tabular-nums"
                      >
                        ID: {co.id}
                      </div>

                      <div className="flex items-center gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setManualCompanyId(co.id)}
                          className="rounded-md border border-slate-700 bg-slate-950 hover:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 transition cursor-pointer whitespace-nowrap"
                        >
                          {isAr ? 'معاينة' : 'Select'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalTarget(co)}
                          className="rounded-md border border-slate-700 bg-slate-950 hover:border-emerald-500/50 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 transition cursor-pointer whitespace-nowrap"
                        >
                          QR / PDF
                        </button>
                        {onOpenCompanyDossier && (
                          <button
                            type="button"
                            onClick={() => onOpenCompanyDossier(co.id)}
                            className="rounded-md bg-cyan-600 hover:bg-cyan-500 px-2.5 py-1 text-[11px] font-bold text-white transition cursor-pointer whitespace-nowrap"
                          >
                            {isAr ? 'الفايل' : 'Dossier'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {modalTarget && (
        <CompanyQrModal
          language={language}
          company={modalTarget}
          onClose={() => setModalTarget(null)}
          onOpenDossier={
            onOpenCompanyDossier
              ? companyId => {
                  setModalTarget(null);
                  onOpenCompanyDossier(companyId);
                }
              : undefined
          }
        />
      )}
    </section>
  );
};
