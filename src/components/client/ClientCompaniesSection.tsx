import React, { useMemo, useState } from 'react';
import {
  Archive,
  Building2,
  CheckCircle2,
  Database,
  FolderOpen,
  Plus,
  QrCode,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import type { Language } from '../../types';
import {
  generateNextCompanyCode,
  sanitizeUpperCode,
  type ArchiveCategory,
  type CompanyRecord,
} from '../../client/types';
import {
  createCompanyWithUniqueCode,
  initializeStarterCompaniesArchive,
} from '../../client/firestoreClientService';
import { CompanyQrModal } from './CompanyQrModal';

interface ClientCompaniesSectionProps {
  language: Language;
  companies: CompanyRecord[];
  loading: boolean;
  isAdmin: boolean;
  currentUid: string;
  onOpenCompanyDossier: (companyId: string) => void;
}

export const ClientCompaniesSection: React.FC<ClientCompaniesSectionProps> = ({
  language,
  companies,
  loading,
  isAdmin,
  currentUid,
  onOpenCompanyDossier,
}) => {
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ArchiveCategory>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [qrModalCompany, setQrModalCompany] = useState<CompanyRecord | null>(null);

  // Create company form state
  const existingCodes = useMemo(() => companies.map(c => c.companyCode), [companies]);
  const [companyCode, setCompanyCode] = useState(() => generateNextCompanyCode(existingCodes));
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [archiveCategory, setArchiveCategory] = useState<ArchiveCategory>('active_testing');
  const [hasActiveTestingDossier, setHasActiveTestingDossier] = useState(true);
  const [sector, setSector] = useState('Oil & Gas / Power');
  const [commercialRegNo, setCommercialRegNo] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [activeScope, setActiveScope] = useState('');
  const [legacySinceYear, setLegacySinceYear] = useState(String(new Date().getFullYear()));
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const openCreateModal = () => {
    setCompanyCode(generateNextCompanyCode(companies.map(c => c.companyCode)));
    setErrorMsg(null);
    setShowCreateForm(true);
  };

  const filteredCompanies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return companies.filter(c => {
      if (categoryFilter !== 'all' && c.archiveCategory !== categoryFilter) return false;
      if (!q) return true;
      return (
        c.companyCode.toLowerCase().includes(q) ||
        c.nameAr.toLowerCase().includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q) ||
        (c.commercialRegNo ?? '').toLowerCase().includes(q)
      );
    });
  }, [companies, searchQuery, categoryFilter]);

  const codeAlreadyUsed = useMemo(
    () => existingCodes.some(c => c.toUpperCase() === sanitizeUpperCode(companyCode)),
    [existingCodes, companyCode]
  );

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cleanCode = sanitizeUpperCode(companyCode);
    if (cleanCode.length < 3) {
      setErrorMsg(isAr ? 'الرقم الكودي يجب ألا يقل عن 3 أحرف.' : 'Company code must be at least 3 chars.');
      return;
    }
    if (codeAlreadyUsed) {
      setErrorMsg(isAr ? 'هذا الرقم الكودي مسجل لشركة أخرى بالفعل.' : 'This Company Code is already assigned.');
      return;
    }
    if (!nameAr.trim() || !nameEn.trim()) {
      setErrorMsg(isAr ? 'يرجى إدخال اسم الشركة بالعربية والإنجليزية.' : 'Please enter both Arabic and English names.');
      return;
    }

    setSaving(true);
    try {
      const created = await createCompanyWithUniqueCode(currentUid, {
        companyCode: cleanCode,
        nameAr: nameAr.trim(),
        nameEn: nameEn.trim(),
        archiveCategory,
        hasActiveTestingDossier,
        sector: sector.trim() || 'Industrial',
        commercialRegNo: commercialRegNo.trim(),
        contactPerson: contactPerson.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        projectLocation: projectLocation.trim(),
        activeScope: activeScope.trim(),
        legacySinceYear: legacySinceYear.trim(),
        assignedClientUid: '',
      });
      setSuccessMsg(
        isAr
          ? `تم تكويد وأرشفة الشركة بنجاح بالكود ${created.companyCode}`
          : `Company archived with unique code ${created.companyCode}`
      );
      setShowCreateForm(false);
      setNameAr('');
      setNameEn('');
      setCommercialRegNo('');
      setActiveScope('');
      onOpenCompanyDossier(created.id);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleSeedArchive = async () => {
    setSeeding(true);
    setErrorMsg(null);
    try {
      const count = await initializeStarterCompaniesArchive(currentUid, companies);
      if (count > 0) {
        setSuccessMsg(
          isAr
            ? `تم إنشاء ${count} ملفات شركات مرجعية بأكواد فريدة وتقارير أساسية.`
            : `Initialized ${count} coded company files with baseline dossier reports.`
        );
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSeeding(false);
    }
  };

  const categoryLabel = (cat: ArchiveCategory) => {
    if (cat === 'active_testing') return isAr ? 'قيد الاختبار (نشط)' : 'Active Testing';
    if (cat === 'legacy_archive') return isAr ? 'أرشيف قديم' : 'Legacy Archive';
    return isAr ? 'شركة جديدة' : 'New Onboarding';
  };

  return (
    <div className="space-y-5" data-testid="client-companies-section">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-white">
            {isAr
              ? 'أرشيف الشركات المكوّد وملفات الاختبارات'
              : 'Coded Company Archive & Testing Dossiers'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'أرشفة كاملة للشركات القديمة والجديدة برقم كودي فريد، مع ملف مخصص لتقارير كل شركة ننفذ لها اختبارات.'
              : 'Legacy & new client company archive indexed by unique Company Code, with dedicated report dossiers for active testing clients.'}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>{isAr ? 'تكويد وإضافة شركة جديدة' : 'Add & Code Company'}</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div
          role="status"
          className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-xs text-emerald-300"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {successMsg}
          </span>
          <button type="button" onClick={() => setSuccessMsg(null)} className="cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            className={`w-3.5 h-3.5 text-slate-400 absolute top-1/2 -translate-y-1/2 ${
              isAr ? 'right-3' : 'left-3'
            }`}
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? 'ابحث بالرقم الكودي (INS-CO-...)، اسم الشركة، أو السجل التجاري...'
                : 'Search by Company Code (INS-CO-...), Name, or CR No...'
            }
            className={`w-full rounded-lg border border-slate-700 bg-slate-950 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none ${
              isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 p-1 text-xs">
          {(
            [
              { id: 'all', ar: 'جميع الشركات', en: 'All' },
              { id: 'active_testing', ar: 'شركات قيد الاختبار', en: 'Active Testing' },
              { id: 'legacy_archive', ar: 'أرشيف قديم', en: 'Legacy Archive' },
              { id: 'new_onboarding', ar: 'شركات جديدة', en: 'New Onboarding' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              className={`rounded-md px-3 py-1.5 font-semibold transition cursor-pointer whitespace-nowrap ${
                categoryFilter === tab.id
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? tab.ar : tab.en}
            </button>
          ))}
        </div>
      </div>

      {/* Add Company Form Modal/Panel */}
      {showCreateForm && isAdmin && (
        <form
          onSubmit={handleCreateCompany}
          className="rounded-xl border border-cyan-500/40 bg-slate-900 p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white">
              {isAr ? 'تكويد وأرشفة شركة جديدة في النظام' : 'Register & Code Company Record'}
            </h3>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <label className="space-y-1">
              <span className="text-slate-400 block">
                {isAr ? 'الرقم الكودي الفريد للشركة *' : 'Unique Company Code *'}
              </span>
              <input
                type="text"
                value={companyCode}
                onChange={e => setCompanyCode(sanitizeUpperCode(e.target.value))}
                className={`w-full rounded-lg border px-3 py-2 font-mono font-bold text-xs focus:outline-none ${
                  codeAlreadyUsed
                    ? 'border-rose-500 bg-rose-950/30 text-rose-300'
                    : 'border-slate-700 bg-slate-950 text-cyan-300 focus:border-cyan-500'
                }`}
              />
              {codeAlreadyUsed && (
                <span className="text-[11px] text-rose-400 block">
                  {isAr ? 'الكود مستخدم بالفعل' : 'Code already exists'}
                </span>
              )}
            </label>

            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'اسم الشركة (عربي) *' : 'Company Name (Arabic) *'}</span>
              <input
                type="text"
                required
                value={nameAr}
                onChange={e => setNameAr(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'اسم الشركة (إنجليزي) *' : 'Company Name (English) *'}</span>
              <input
                type="text"
                required
                value={nameEn}
                onChange={e => setNameEn(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'التصنيف' : 'Archive Classification'}</span>
              <select
                value={archiveCategory}
                onChange={e => setArchiveCategory(e.target.value as ArchiveCategory)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              >
                <option value="active_testing">{isAr ? 'شركة قيد الاختبار (نشطة)' : 'Active Testing'}</option>
                <option value="legacy_archive">{isAr ? 'أرشيف شركات قديمة' : 'Legacy Archive'}</option>
                <option value="new_onboarding">{isAr ? 'شركة جديدة' : 'New Onboarding'}</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'القطاع الصناعي *' : 'Industry Sector *'}</span>
              <input
                type="text"
                required
                value={sector}
                onChange={e => setSector(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'سنة بداية التعامل / الأرشيف' : 'Client Since Year'}</span>
              <input
                type="text"
                value={legacySinceYear}
                onChange={e => setLegacySinceYear(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'السجل التجاري' : 'Commercial Reg No.'}</span>
              <input
                type="text"
                value={commercialRegNo}
                onChange={e => setCommercialRegNo(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'موقع المشروع' : 'Site / Plant Location'}</span>
              <input
                type="text"
                value={projectLocation}
                onChange={e => setProjectLocation(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'المهندس المسؤول / التواصل' : 'Contact Person'}</span>
              <input
                type="text"
                value={contactPerson}
                onChange={e => setContactPerson(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'البريد الإلكتروني' : 'Contact Email'}</span>
              <input
                type="email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
            </label>

            <label className="space-y-1">
              <span className="text-slate-400 block">{isAr ? 'رقم الهاتف' : 'Contact Phone'}</span>
              <input
                type="text"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white"
              />
            </label>

            <div className="flex items-end">
              <label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 w-full cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasActiveTestingDossier}
                  onChange={e => setHasActiveTestingDossier(e.target.checked)}
                  className="accent-emerald-500"
                />
                <span>{isAr ? 'فتح فايل اختبارات نشط' : 'Active Testing Dossier'}</span>
              </label>
            </div>
          </div>

          <label className="block space-y-1 text-xs">
            <span className="text-slate-400 block">{isAr ? 'نطاق الاختبارات والخدمات' : 'Testing & Scope Summary'}</span>
            <textarea
              rows={2}
              value={activeScope}
              onChange={e => setActiveScope(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </label>

          {errorMsg && (
            <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="rounded-lg border border-slate-700 px-3.5 py-2 text-xs text-slate-300 hover:bg-slate-800 cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving || codeAlreadyUsed}
              className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-4 py-2 text-xs font-black text-slate-950 cursor-pointer"
            >
              {saving ? (isAr ? 'جاري التكويد...' : 'Saving...') : isAr ? 'حفظ وتكويد الشركة' : 'Save & Assign Code'}
            </button>
          </div>
        </form>
      )}

      {/* Companies Table / Empty / Loading */}
      {loading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 rounded-lg bg-slate-800/70 animate-pulse" />
          ))}
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 p-10 text-center space-y-3">
          <Archive className="w-9 h-9 text-slate-500 mx-auto" aria-hidden="true" />
          <div className="text-sm font-bold text-white">
            {companies.length === 0
              ? isAr
                ? 'أرشيف الشركات فارغ حالياً أو لم يُربط حسابك بكود شركة بعد'
                : 'No coded company files linked yet'
              : isAr
                ? 'لا توجد شركات مطابقة لبحثك'
                : 'No companies match your search'}
          </div>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            {isAdmin
              ? isAr
                ? 'يمكنك إضافة وتكويد أول شركة يدوياً، أو تهيئة نماذج سابقة لشركات إنسكو للتجربة الفورية.'
                : 'Add your first coded company manually, or initialize starter legacy & active companies to begin.'
              : isAr
                ? 'بمجرد تسجيل حسابك ومراجعته من فريق إنسكو، سيظهر هنا ملف شركتك بالكود الخاص بها وتقارير الفحص المؤرشفة.'
                : 'Once INSCO operations links your registered account to your Company Code, your company dossier and reports will appear here.'}
          </p>
          {isAdmin && companies.length === 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'تكويد أول شركة' : 'Add First Company'}</span>
              </button>
              <button
                type="button"
                disabled={seeding}
                onClick={() => void handleSeedArchive()}
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-2 text-xs font-bold text-cyan-300 cursor-pointer"
              >
                <Database className="w-4 h-4" />
                <span>
                  {seeding
                    ? isAr
                      ? 'جاري التهيئة...'
                      : 'Initializing...'
                    : isAr
                      ? 'توليد 3 شركات مرجعية بالأكواد والتقارير'
                      : 'Initialize 3 Sample Coded Companies'}
                </span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 text-start">{isAr ? 'الكود الفريد' : 'Company Code'}</th>
                <th className="px-4 py-3 text-start">{isAr ? 'اسم الشركة' : 'Company Name'}</th>
                <th className="px-4 py-3 text-start">{isAr ? 'التصنيف' : 'Category'}</th>
                <th className="px-4 py-3 text-start">{isAr ? 'القطاع / الموقع' : 'Sector & Site'}</th>
                <th className="px-4 py-3 text-start">{isAr ? 'التقارير' : 'Reports'}</th>
                <th className="px-4 py-3 text-start">{isAr ? 'ملف الشركة' : 'Dossier'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredCompanies.map(co => (
                <tr key={co.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-4 py-3 font-mono font-bold text-cyan-300 tabular-nums whitespace-nowrap">
                    {co.companyCode}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-white flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span>{isAr ? co.nameAr : co.nameEn}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {isAr ? co.nameEn : co.nameAr}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${
                        co.hasActiveTestingDossier
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-700 bg-slate-800 text-slate-300'
                      }`}
                    >
                      {co.hasActiveTestingDossier && <Sparkles className="w-3 h-3" aria-hidden="true" />}
                      {categoryLabel(co.archiveCategory)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    <div>{co.sector}</div>
                    {co.projectLocation && (
                      <div className="text-[11px] text-slate-500">{co.projectLocation}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-white tabular-nums whitespace-nowrap">
                    {co.reportsCount ?? 0}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenCompanyDossier(co.id)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 text-[11px] font-bold text-white transition cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{isAr ? 'فتح الفايل والتقارير' : 'Open Dossier'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrModalCompany(co)}
                        aria-label={isAr ? `عرض QR للشركة ${co.nameAr}` : `Show QR pass for ${co.nameEn}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 hover:border-emerald-500/60 hover:text-emerald-300 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 transition cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <QrCode className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                        <span>QR</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {qrModalCompany && (
        <CompanyQrModal
          language={language}
          company={qrModalCompany}
          onClose={() => setQrModalCompany(null)}
          onOpenDossier={companyId => {
            setQrModalCompany(null);
            onOpenCompanyDossier(companyId);
          }}
        />
      )}
    </div>
  );
};
