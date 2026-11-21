import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import { CheckCircle2, Mail, Phone, UserCheck } from 'lucide-react';
import type { Language } from '../../types';
import {
  sanitizeUpperCode,
  type ClientAccount,
  type ClientRegistrationDraftInput,
} from '../../client/types';
import {
  detectUserAuthMethod,
  normalizePhoneDigits,
  formatClientProfileError,
  saveClientRegistration,
  type ClientProfileSaveResult,
} from '../../client/firestoreClientService';
import { ClientRegistrationFormFields } from './ClientRegistrationFormFields';
import { AccountPrivacyNotice } from '../account/AccountPrivacyNotice';

interface ClientRegistrationSectionProps {
  language: Language;
  user: User;
  account: ClientAccount | null;
  pendingDraft?: ClientRegistrationDraftInput | null;
  onSaveDraft?: (input: ClientRegistrationDraftInput) => void;
  onSaved?: (input: ClientRegistrationDraftInput, result: ClientProfileSaveResult) => void;
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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setErrorMsg(null);
    setSavedOk(false);

    if (
      formDraft.fullName.trim().length < 2 ||
      (formDraft.phone.trim() !== '' && normalizePhoneDigits(formDraft.phone).replace(/\D/g, '').length < 5) ||
      (formDraft.organizationName.trim() !== '' && formDraft.organizationName.trim().length < 2)
    ) {
      setErrorMsg(
        isAr
          ? 'اكتب اسمك بالكامل. لو أضفت رقم هاتف أو اسم شركة، تأكد من صحتهما.'
          : 'Enter your full name. If you add a phone number or company name, make sure it is valid.'
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
                ? 'ملفك الخاص لحساب إنسكو الموحد. بيانات الشركة والهاتف اختيارية، وتقدر تضيفها عند طلب خدمة.'
                : 'Your private profile for your unified INSCO account. Company details and phone are optional; add them when requesting service.'}
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

        <AccountPrivacyNotice language={language} />

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
            requireCompanyDetails={false}
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

    </div>
  );
};
