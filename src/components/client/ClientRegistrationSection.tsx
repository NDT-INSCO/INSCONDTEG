import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { CheckCircle2, Link2, Mail, Phone, ShieldCheck, UserCheck } from 'lucide-react';
import type { Language } from '../../types';
import {
  sanitizeUpperCode,
  type ClientAccount,
  type ClientApprovalStatus,
  type ClientRegistrationDraftInput,
  type CompanyRecord,
} from '../../client/types';
import {
  adminApproveAndLinkClientAccount,
  detectUserAuthMethod,
  formatClientProfileError,
  saveClientRegistration,
  type ClientProfileSaveResult,
} from '../../client/firestoreClientService';
import { ClientRegistrationFormFields } from './ClientRegistrationFormFields';

interface ClientRegistrationSectionProps {
  language: Language;
  user: User;
  account: ClientAccount | null;
  pendingDraft?: ClientRegistrationDraftInput | null;
  onSaveDraft?: (input: ClientRegistrationDraftInput) => void;
  onSaved?: (input: ClientRegistrationDraftInput, result: ClientProfileSaveResult) => void;
  allAccounts: ClientAccount[];
  companies: CompanyRecord[];
  isAdmin: boolean;
}

function buildInitialDraft(
  user: User,
  account: ClientAccount | null,
  pendingDraft?: ClientRegistrationDraftInput | null
): ClientRegistrationDraftInput {
  const pending = !account ? pendingDraft : null;
  return {
    fullName: account?.fullName || pending?.fullName || user.displayName || '',
    personalEmail: account?.email || pending?.personalEmail || user.email || '',
    phone: account?.phone || pending?.phone || user.phoneNumber || '',
    jobTitle: account?.jobTitle || pending?.jobTitle || '',
    nationalId: account?.nationalId || pending?.nationalId || '',
    secondaryPhone: account?.secondaryPhone || pending?.secondaryPhone || '',
    personalAddress: account?.personalAddress || pending?.personalAddress || '',
    organizationName: account?.organizationName || pending?.organizationName || '',
    organizationNameEn: account?.organizationNameEn || pending?.organizationNameEn || '',
    sector: account?.sector || pending?.sector || 'Oil & Gas / Power',
    commercialRegNo: account?.commercialRegNo || pending?.commercialRegNo || '',
    taxCardNo: account?.taxCardNo || pending?.taxCardNo || '',
    companyPhone: account?.companyPhone || pending?.companyPhone || '',
    companyEmail: account?.companyEmail || pending?.companyEmail || '',
    website: account?.website || pending?.website || '',
    companyAddress: account?.companyAddress || pending?.companyAddress || '',
    cityGovernorate: account?.cityGovernorate || pending?.cityGovernorate || '',
    activeScope: account?.activeScope || pending?.activeScope || '',
    requestedCompanyCode: account?.requestedCompanyCode || pending?.requestedCompanyCode || '',
    autoCreateCompanyWorkspace: false,
  };
}

export const ClientRegistrationSection: React.FC<ClientRegistrationSectionProps> = ({
  language,
  user,
  account,
  pendingDraft,
  onSaveDraft,
  onSaved,
  allAccounts,
  companies,
  isAdmin,
}) => {
  const isAr = language === 'ar';
  const authMethod = account?.authMethod ?? detectUserAuthMethod(user);

  // Use live values until the customer starts editing. New snapshots (for
  // example, an approval or company link from staff) must not erase edits.
  const [edits, setEdits] = useState<ClientRegistrationDraftInput | null>(null);
  const formDraft = edits ?? buildInitialDraft(user, account, pendingDraft);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Admin link map per account
  const [selectedCompanyByUid, setSelectedCompanyByUid] = useState<Record<string, string>>({});

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setErrorMsg(null);
    setSavedOk(false);

    if (
      formDraft.fullName.trim().length < 2 ||
      formDraft.phone.trim().length < 5 ||
      formDraft.organizationName.trim().length < 2
    ) {
      setErrorMsg(
        isAr
          ? 'يرجى إدخال الاسم الكامل، رقم الهاتف، واسم الشركة بشكل صحيح.'
          : 'Please enter valid Full Name, Phone, and Organization Name.'
      );
      return;
    }

    setSaving(true);
    try {
      const input = {
        ...formDraft,
        requestedCompanyCode: sanitizeUpperCode(formDraft.requestedCompanyCode ?? ''),
      };
      onSaveDraft?.(input);
      const result = await saveClientRegistration(user, input);
      onSaved?.(input, result);
      setEdits(null);
      setSavedOk(!onSaved);
    } catch (err) {
      setErrorMsg(
        (isAr ? 'لم تُحفظ التعديلات. ' : 'Changes were not saved. ') + formatClientProfileError(err, language)
      );
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

  const authBadgeLabel =
    authMethod === 'phone'
      ? isAr
        ? 'موثّق برقم التليفون'
        : 'Phone OTP'
      : authMethod === 'email'
        ? isAr
          ? 'حساب بريد إلكتروني'
          : 'Email Auth'
        : isAr
          ? 'حساب Google'
          : 'Google Auth';

  return (
    <div className="space-y-6" data-testid="client-registration-section">
      {/* My Account Registration Card */}
      <form
        onSubmit={e => void handleSaveProfile(e)}
        className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div>
            <h2 className="text-base font-black text-white">
              {isAr
                ? 'الملف الشخصي الكامل وبيانات الشركة وربط الكود'
                : 'Complete Personal & Company Registration Profile'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'حدّث جميع بياناتك الشخصية والبيانات الرسمية لشركتك؛ واستخدم الكود الخاص بها لربط ملف التقارير بحسابك.'
                : 'Maintain your complete personal representative profile and official company records.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-slate-200">
              {authMethod === 'phone' ? (
                <Phone className="w-3 h-3 text-emerald-400" aria-hidden="true" />
              ) : (
                <Mail className="w-3 h-3 text-cyan-400" aria-hidden="true" />
              )}
              <span>{authBadgeLabel}</span>
            </span>

            {account && (
              <span
                className={`rounded-md border px-2.5 py-1 font-bold ${
                  account.approvalStatus === 'approved'
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                }`}
              >
                {account.approvalStatus.toUpperCase()}
              </span>
            )}
            {account?.assignedCompanyCode && (
              <span className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 font-bold text-cyan-300">
                {account.assignedCompanyCode}
              </span>
            )}
          </div>
        </div>

        <fieldset disabled={saving}>
          <ClientRegistrationFormFields
            language={language}
            value={formDraft}
            onChange={next => {
              setEdits(next);
              setSavedOk(false);
            }}
            lockPersonalEmail={Boolean(user.email && authMethod !== 'phone')}
            lockPrimaryPhone={Boolean(user.phoneNumber && authMethod === 'phone')}
            showAutoCreateCompanyToggle={false}
          />
        </fieldset>

        {errorMsg && (
          <div
            role="alert"
            className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300"
          >
            {errorMsg}
          </div>
        )}

        {savedOk && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {isAr
                ? 'تم حفظ جميع البيانات الشخصية وبيانات الشركة في حسابك بنجاح.'
                : 'Your complete personal and company registration profile has been saved.'}
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
                  ? 'تحديث جميع البيانات وحفظها'
                  : 'Update Complete Profile'
                : isAr
                  ? 'إتمام وحفظ التسجيل الكامل'
                  : 'Complete & Save Registration'}
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
                ? 'إدارة الحسابات المسجلة ومراجعة البيانات الشخصية والشركات'
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
                  className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-white">{acc.fullName}</span>
                      {acc.jobTitle && (
                        <span className="text-cyan-300">({acc.jobTitle})</span>
                      )}
                      <span className="text-slate-300 font-semibold">· {acc.organizationName}</span>
                      {acc.requestedCompanyCode && (
                        <span className="font-mono text-amber-300">
                          [{isAr ? 'كود مطلوب:' : 'Req:'} {acc.requestedCompanyCode}]
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>{acc.email}</span>
                      <span>{acc.phone}</span>
                      {acc.commercialRegNo && <span>CR: {acc.commercialRegNo}</span>}
                      {acc.taxCardNo && <span>Tax: {acc.taxCardNo}</span>}
                      {acc.cityGovernorate && <span>{acc.cityGovernorate}</span>}
                      {acc.authMethod && <span>via {acc.authMethod.toUpperCase()}</span>}
                      <span>· {acc.approvalStatus}</span>
                      {acc.assignedCompanyCode && <span>· Linked: {acc.assignedCompanyCode}</span>}
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
