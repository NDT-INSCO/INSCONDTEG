import React, { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { CheckCircle2, Link2, ShieldCheck, UserCheck } from 'lucide-react';
import type { Language } from '../../types';
import {
  sanitizeUpperCode,
  type ClientAccount,
  type ClientApprovalStatus,
  type CompanyRecord,
} from '../../client/types';
import {
  adminApproveAndLinkClientAccount,
  saveClientRegistration,
} from '../../client/firestoreClientService';

interface ClientRegistrationSectionProps {
  language: Language;
  user: User;
  account: ClientAccount | null;
  allAccounts: ClientAccount[];
  companies: CompanyRecord[];
  isAdmin: boolean;
}

export const ClientRegistrationSection: React.FC<ClientRegistrationSectionProps> = ({
  language,
  user,
  account,
  allAccounts,
  companies,
  isAdmin,
}) => {
  const isAr = language === 'ar';

  const [fullName, setFullName] = useState(account?.fullName || user.displayName || '');
  const [phone, setPhone] = useState(account?.phone || '');
  const [organizationName, setOrganizationName] = useState(account?.organizationName || '');
  const [sector, setSector] = useState(account?.sector || 'Oil & Gas / Power');
  const [requestedCompanyCode, setRequestedCompanyCode] = useState(
    account?.requestedCompanyCode || ''
  );

  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Admin link map per account
  const [selectedCompanyByUid, setSelectedCompanyByUid] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!account) return;
    setFullName(account.fullName);
    setPhone(account.phone);
    setOrganizationName(account.organizationName);
    setSector(account.sector || '');
    setRequestedCompanyCode(account.requestedCompanyCode || '');
  }, [account]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSavedOk(false);

    if (fullName.trim().length < 2 || phone.trim().length < 5 || organizationName.trim().length < 2) {
      setErrorMsg(
        isAr
          ? 'يرجى إدخال الاسم الكامل، رقم الهاتف، واسم الشركة بشكل صحيح.'
          : 'Please enter valid Full Name, Phone, and Organization Name.'
      );
      return;
    }

    setSaving(true);
    try {
      await saveClientRegistration(
        user,
        {
          fullName: fullName.trim(),
          phone: phone.trim(),
          organizationName: organizationName.trim(),
          requestedCompanyCode: sanitizeUpperCode(requestedCompanyCode),
          sector: sector.trim(),
        },
        account
      );
      setSavedOk(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAdminLink = async (
    targetAccount: ClientAccount,
    status: ClientApprovalStatus
  ) => {
    const chosenCompanyId =
      selectedCompanyByUid[targetAccount.uid] ?? targetAccount.assignedCompanyId ?? '';
    const companyObj = companies.find(c => c.id === chosenCompanyId) ?? null;
    await adminApproveAndLinkClientAccount({
      clientUid: targetAccount.uid,
      approvalStatus: status,
      company: companyObj,
    });
  };

  return (
    <div className="space-y-6" data-testid="client-registration-section">
      {/* My Account Registration Card */}
      <form
        onSubmit={handleSaveProfile}
        className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-black text-white">
              {isAr ? 'بيانات التسجيل في الموقع وربط كود الشركة' : 'Client Account Registration & Company Code Link'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'سجّل بيانات جهتك؛ وإذا كانت شركتك مرسلة مسبقاً، اكتب الكود الخاص بها لربط ملف التقارير بحسابك.'
                : 'Register your organization details. Include your INSCO Company Code if your company already has an archive dossier.'}
            </p>
          </div>

          {account && (
            <div className="flex items-center gap-2 text-xs font-mono">
              <span
                className={`rounded-md border px-2.5 py-1 font-bold ${
                  account.approvalStatus === 'approved'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                }`}
              >
                {account.approvalStatus.toUpperCase()}
              </span>
              {account.assignedCompanyCode && (
                <span className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 font-bold text-cyan-300">
                  {account.assignedCompanyCode}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <label className="space-y-1">
            <span className="text-slate-400 block">{isAr ? 'الاسم الكامل *' : 'Full Name *'}</span>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400 block">{isAr ? 'البريد الإلكتروني الموثّق' : 'Verified Email'}</span>
            <input
              type="email"
              disabled
              value={user.email || ''}
              className="w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 font-mono text-xs text-slate-400"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400 block">{isAr ? 'رقم الهاتف / واتساب *' : 'Phone / WhatsApp *'}</span>
            <input
              type="text"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400 block">{isAr ? 'اسم الشركة / الجهة *' : 'Organization Name *'}</span>
            <input
              type="text"
              required
              value={organizationName}
              onChange={e => setOrganizationName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400 block">{isAr ? 'القطاع الصناعي' : 'Sector'}</span>
            <input
              type="text"
              value={sector}
              onChange={e => setSector(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
            />
          </label>

          <label className="space-y-1">
            <span className="text-slate-400 block">
              {isAr ? 'كود الشركة المطلوب ربطه (اختياري)' : 'Existing Company Code (optional)'}
            </span>
            <input
              type="text"
              value={requestedCompanyCode}
              onChange={e => setRequestedCompanyCode(sanitizeUpperCode(e.target.value))}
              placeholder="INS-CO-0101"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-cyan-300 focus:border-cyan-500 focus:outline-none"
            />
          </label>
        </div>

        {errorMsg && (
          <div role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            {errorMsg}
          </div>
        )}

        {savedOk && (
          <div role="status" className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {isAr
                ? 'تم حفظ بيانات تسجيلك في الموقع بنجاح.'
                : 'Your Client Portal registration profile has been saved.'}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-white transition cursor-pointer"
        >
          <UserCheck className="w-4 h-4" />
          <span>
            {saving
              ? isAr
                ? 'جاري الحفظ...'
                : 'Saving...'
              : account
                ? isAr
                  ? 'تحديث بيانات الحساب'
                  : 'Update Registration Profile'
                : isAr
                  ? 'إتمام التسجيل في الموقع'
                  : 'Complete Site Registration'}
          </span>
        </button>
      </form>

      {/* Admin Client Approval & Company Code Binding Desk */}
      {isAdmin && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-amber-400" aria-hidden="true" />
            <h3 className="text-sm font-black text-white">
              {isAr
                ? 'إدارة الحسابات المسجلة وربطها بأكواد الشركات'
                : 'Registered Client Accounts & Company Code Binding'}
            </h3>
          </div>

          {allAccounts.length === 0 ? (
            <div className="text-xs text-slate-400 py-4 text-center">
              {isAr ? 'لا توجد حسابات مسجلة أخرى حتى الآن.' : 'No registered client accounts yet.'}
            </div>
          ) : (
            <div className="space-y-3">
              {allAccounts.map(acc => (
                <div
                  key={acc.uid}
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white">{acc.fullName}</span>
                      <span className="text-slate-400">· {acc.organizationName}</span>
                      {acc.requestedCompanyCode && (
                        <span className="font-mono text-amber-300">
                          [{isAr ? 'كود مطلوب:' : 'Req:'} {acc.requestedCompanyCode}]
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400">
                      {acc.email} · {acc.phone} · {acc.approvalStatus}
                      {acc.assignedCompanyCode ? ` · Linked: ${acc.assignedCompanyCode}` : ''}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={selectedCompanyByUid[acc.uid] ?? acc.assignedCompanyId ?? ''}
                      onChange={e =>
                        setSelectedCompanyByUid(prev => ({ ...prev, [acc.uid]: e.target.value }))
                      }
                      className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="">{isAr ? '— اختر شركة لربطها —' : '— Select Company —'}</option>
                      {companies.map(co => (
                        <option key={co.id} value={co.id}>
                          {co.companyCode} · {isAr ? co.nameAr : co.nameEn}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => void handleAdminLink(acc, 'approved')}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-white cursor-pointer"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'اعتماد وربط الكود' : 'Approve & Link'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
