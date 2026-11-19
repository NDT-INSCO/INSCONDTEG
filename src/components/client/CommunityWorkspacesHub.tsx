import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import {
  Building2,
  CheckCircle2,
  Clock,
  Globe2,
  MapPin,
  Save,
  Users,
} from 'lucide-react';
import type { Language } from '../../types';
import type {
  ClientAccount,
  CommunityWorkspaceProfile,
  CompanyRecord,
} from '../../client/types';
import { upsertCommunityWorkspace } from '../../client/firestoreClientService';

interface CommunityWorkspacesHubProps {
  language: Language;
  user: User;
  account: ClientAccount | null;
  myProfile: CommunityWorkspaceProfile | null;
  directoryProfiles: CommunityWorkspaceProfile[];
  companies: CompanyRecord[];
  onOpenCompanies: () => void;
  onOpenTimeClock: () => void;
}

export const CommunityWorkspacesHub: React.FC<CommunityWorkspacesHubProps> = ({
  language,
  user,
  account,
  myProfile,
  directoryProfiles,
  companies,
  onOpenCompanies,
  onOpenTimeClock,
}) => {
  const isAr = language === 'ar';

  const [displayName, setDisplayName] = useState(
    myProfile?.displayName || account?.fullName || user.displayName || ''
  );
  const [organizationName, setOrganizationName] = useState(
    myProfile?.organizationName ||
      account?.organizationName ||
      (companies[0] ? (isAr ? companies[0].nameAr : companies[0].nameEn) : '')
  );
  const [sector, setSector] = useState(myProfile?.sector || account?.sector || 'NDT & Industrial Inspection');
  const [city, setCity] = useState(myProfile?.city || 'Cairo, Egypt');
  const [companyCode, setCompanyCode] = useState(
    myProfile?.companyCode || companies[0]?.companyCode || ''
  );
  const [specialtyTrades, setSpecialtyTrades] = useState(
    myProfile?.specialtyTrades || 'RT, UT, PAUT, PWHT, QA/QC'
  );
  const [bio, setBio] = useState(myProfile?.bio || '');
  const [isPublished, setIsPublished] = useState(myProfile?.isPublished ?? true);

  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (myProfile) {
      setDisplayName(myProfile.displayName);
      setOrganizationName(myProfile.organizationName);
      setSector(myProfile.sector);
      setCity(myProfile.city || '');
      setCompanyCode(myProfile.companyCode || '');
      setSpecialtyTrades(myProfile.specialtyTrades || '');
      setBio(myProfile.bio || '');
      setIsPublished(myProfile.isPublished);
    }
  }, [myProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setStatusMsg(null);
    if (displayName.trim().length < 2 || organizationName.trim().length < 2) {
      setErrorMsg(
        isAr
          ? 'يرجى إدخال اسم المسؤول واسم الجهة/الشركة.'
          : 'Please enter your display name and organization name.'
      );
      return;
    }

    setSaving(true);
    try {
      await upsertCommunityWorkspace(
        user,
        {
          displayName: displayName.trim(),
          organizationName: organizationName.trim(),
          sector: sector.trim() || 'Industrial',
          city: city.trim(),
          companyCode: companyCode.trim(),
          specialtyTrades: specialtyTrades.trim(),
          bio: bio.trim(),
          companiesManaged: companies.length,
          isPublished,
        },
        myProfile
      );
      setStatusMsg(
        isAr
          ? 'تم تحديث بطاقة مساحة العمل في مجتمع إدارة الأعمال.'
          : 'Community workspace profile updated.'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const filteredDirectory = directoryProfiles.filter(profile => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      profile.organizationName.toLowerCase().includes(q) ||
      profile.displayName.toLowerCase().includes(q) ||
      profile.sector.toLowerCase().includes(q) ||
      (profile.city ?? '').toLowerCase().includes(q) ||
      (profile.specialtyTrades ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div data-testid="community-workspaces-hub" className="space-y-5">
      {/* Header Banner */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-cyan-400">
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'كوميونتي إدارة الأعمال المتكامل' : 'Integrated Multi-User Business Community'}</span>
          </div>
          <h2 className="text-lg font-black text-white">
            {isAr
              ? 'مساحة الأعمال المشتركة، الشركات المسجلة، ومتابعة الفرق الميدانية'
              : 'Operator Workspace Profile & Published Business Directory'}
          </h2>
          <p className="text-xs text-slate-400">
            {isAr
              ? 'كل حساب مشترك يمتلك أدواته الخاصة لإدارة شركاته، تتبع موظفيه بالخرائط، والنشر الاختياري في دليل المجتمع.'
              : 'Every registered account operates its own coded companies, GPS crew tracking, and optional public community profile.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenCompanies}
            className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-bold text-white cursor-pointer whitespace-nowrap"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{isAr ? `شركاتي (${companies.length})` : `My Companies (${companies.length})`}</span>
          </button>
          <button
            type="button"
            onClick={onOpenTimeClock}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 px-3.5 py-2 text-xs font-bold text-emerald-300 cursor-pointer whitespace-nowrap"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isAr ? 'بوابة الحضور والانصراف' : 'Worker Time-Clock'}</span>
          </button>
        </div>
      </div>

      {/* My Public Workspace Card Editor */}
      <form
        onSubmit={handleSave}
        className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h3 className="text-sm font-black text-white">
            {isAr ? 'ملف مساحة العمل الخاص بحسابك (بلا بيانات شخصية حساسة)' : 'Your Business Community Profile (Zero-PII)'}
          </h3>
          <label className="inline-flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={e => setIsPublished(e.target.checked)}
              className="accent-emerald-500"
            />
            <span>{isAr ? 'نشر في دليل مجتمع المنصة' : 'Publish in Community Directory'}</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <label className="space-y-1">
            <span className="text-slate-400 block">{isAr ? 'اسم المدير / المشغّل *' : 'Operator Name *'}</span>
            <input
              type="text"
              required
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </label>
          <label className="space-y-1">
            <span className="text-slate-400 block">{isAr ? 'اسم المنشأة / القسم *' : 'Organization / Division *'}</span>
            <input
              type="text"
              required
              value={organizationName}
              onChange={e => setOrganizationName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </label>
          <label className="space-y-1">
            <span className="text-slate-400 block">{isAr ? 'القطاع / التخصص *' : 'Industry Sector *'}</span>
            <input
              type="text"
              required
              value={sector}
              onChange={e => setSector(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </label>
          <label className="space-y-1">
            <span className="text-slate-400 block">{isAr ? 'المدينة / نطاق التشغيل' : 'City / Region'}</span>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </label>
          <label className="space-y-1">
            <span className="text-slate-400 block">{isAr ? 'الكود التعريفي الأساسي' : 'Primary Company Code'}</span>
            <input
              type="text"
              value={companyCode}
              onChange={e => setCompanyCode(e.target.value.toUpperCase())}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-cyan-300"
            />
          </label>
          <label className="space-y-1">
            <span className="text-slate-400 block">{isAr ? 'الخدمات / المهارات الفنية' : 'Technical Capabilities'}</span>
            <input
              type="text"
              value={specialtyTrades}
              onChange={e => setSpecialtyTrades(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
            />
          </label>
        </div>

        <label className="block space-y-1 text-xs">
          <span className="text-slate-400 block">{isAr ? 'نبذة عن القسم والفرق الميدانية' : 'Workspace Summary'}</span>
          <textarea
            rows={2}
            value={bio}
            onChange={e => setBio(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
          />
        </label>

        {errorMsg && (
          <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}
        {statusMsg && (
          <div role="status" className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : isAr ? 'حفظ بطاقة المجتمع' : 'Save Community Card'}</span>
          </button>
        </div>
      </form>

      {/* Community Directory Grid */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-black text-white">
            <Globe2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            <span>
              {isAr
                ? `دليل الشركات والمشتركين (${filteredDirectory.length})`
                : `Community Member Workspaces (${filteredDirectory.length})`}
            </span>
          </div>
          <input
            type="search"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'ابحث باسم الشركة، القطاع، أو المدينة...' : 'Filter by organization, sector, or city...'}
            className="w-full sm:w-72 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-white"
          />
        </div>

        {filteredDirectory.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center text-xs text-slate-400">
            {isAr
              ? 'لا توجد حسابات منشورة مطابقة حالياً. احفظ بطاقتك لتظهر في دليل المجتمع.'
              : 'No published community workspaces match yet. Save and publish your workspace card above.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredDirectory.map(member => (
              <div
                key={member.uid}
                className="rounded-xl border border-slate-800 bg-slate-950/75 p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-black text-white">{member.organizationName}</div>
                    <div className="text-xs text-slate-400">{member.displayName}</div>
                  </div>
                  {member.companyCode && (
                    <span className="rounded border border-cyan-500/35 bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                      {member.companyCode}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-emerald-300 font-semibold">{member.sector}</div>
                {member.bio && <p className="text-xs text-slate-300 line-clamp-2">{member.bio}</p>}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" aria-hidden="true" />
                    {member.city || '-'}
                  </span>
                  <span className="font-mono tabular-nums">
                    {member.companiesManaged} {isAr ? 'شركات مدارة' : 'companies'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
