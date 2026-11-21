import { useEffect, useState, type FormEvent } from 'react';
import type { User } from 'firebase/auth';
import { ShieldCheck } from 'lucide-react';
import type { ClientAccount, CompanyRecord } from '../../client/types';
import { adminApproveAndLinkClientAccount } from '../../client/firestoreClientService';
import {
  ACCOUNT_REVIEW_MS, ACCOUNT_REVIEW_REASONS, canReviewPrivateAccounts, reviewPrivateAccount, validAccountReview,
  type AccountReviewReason,
} from '../../account/privateAccountReview';
import type { Language } from '../../types';

const reasons = {
  account_support: { ar: 'دعم الحساب', en: 'Account support' },
  company_link: { ar: 'اعتماد وربط الشركة', en: 'Company approval and linking' },
  data_request: { ar: 'طلب متعلق بالبيانات', en: 'Data request' },
};

export function PrivateAccountReview({ language, user, companies, canLinkCompany }: {
  language: Language; user: User; companies: CompanyRecord[]; canLinkCompany: boolean;
}) {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    let active = true;
    void canReviewPrivateAccounts(user.uid).then(
      value => { if (active) setAllowed(value); },
      () => { if (active) setAllowed(false); },
    );
    return () => { active = false; };
  }, [user.uid]);
  return allowed ? <ReviewForm key={user.uid} language={language} companies={companies} canLinkCompany={canLinkCompany} /> : null;
}

function ReviewForm({ language, companies, canLinkCompany }: {
  language: Language; companies: CompanyRecord[]; canLinkCompany: boolean;
}) {
  const isAr = language === 'ar';
  const [target, setTarget] = useState('');
  const [caseId, setCaseId] = useState('');
  const [reason, setReason] = useState<AccountReviewReason | ''>('');
  const [view, setView] = useState<{ account: ClientAccount; expires: number; reason: AccountReviewReason } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [companyId, setCompanyId] = useState('');
  useEffect(() => {
    if (!view) return;
    const timer = setTimeout(() => setView(null), Math.max(0, view.expires - Date.now()));
    return () => clearTimeout(timer);
  }, [view]);

  const open = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    setStatus('');
    setView(null);
    setCompanyId('');
    const input = { subjectUid: target.trim(), caseReference: caseId.trim(), reason: reason as AccountReviewReason };
    if (!validAccountReview(input)) {
      setError(isAr ? 'أدخل معرّف الحساب، واختر السبب، واكتب رقم تذكرة صحيح بدون بيانات شخصية.' : 'Enter the account ID, choose a reason, and enter a valid case reference without personal data.');
      return;
    }
    const expires = Date.now() + ACCOUNT_REVIEW_MS;
    setBusy(true);
    try {
      const account = await reviewPrivateAccount(input);
      if (!account) {
        setError(isAr ? 'لا يوجد ملف محفوظ لهذا المعرّف.' : 'No saved profile for this account ID.');
      } else if (expires > Date.now()) {
        setCompanyId(account.assignedCompanyId ?? '');
        setView({ account, expires, reason: input.reason });
      }
    } catch {
      setError(isAr ? 'تعذّرت المراجعة. تأكّد من صلاحيتك والاتصال وحاول مرة أخرى.' : 'Could not open the review. Check your access and connection, then retry.');
    } finally {
      setBusy(false);
    }
  };

  const link = async () => {
    const company = companies.find(record => record.id === companyId);
    if (!view || view.reason !== 'company_link' || !company || !canLinkCompany || busy || view.expires <= Date.now()) return;
    setBusy(true);
    setError('');
    try {
      await adminApproveAndLinkClientAccount({ clientUid: view.account.uid, approvalStatus: 'approved', company });
      setView(null);
      setStatus(isAr ? 'تم اعتماد الحساب وربط الشركة.' : 'Account approved and company linked.');
    } catch {
      setError(isAr ? 'لم يتم الربط. تأكد من أن إذن المراجعة ما زال صالحًا.' : 'Linking failed. Check that the review grant is still active.');
    } finally {
      setBusy(false);
    }
  };
  const field = 'mt-1 w-full min-w-0 rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-white';
  return (
    <section className="space-y-4 rounded-xl border border-amber-500/30 bg-slate-900/70 p-4 sm:p-5" aria-label={isAr ? 'مراجعة إدارية خاصة' : 'Private account review'}>
      <h2 className="flex items-center gap-2 text-sm font-black text-white">
        <ShieldCheck className="h-4 w-4 text-amber-300" aria-hidden="true" />
        {isAr ? 'مراجعة ملف عميل محدد' : 'Review a specific client profile'}
      </h2>
      <p className="text-xs text-slate-300">
        {isAr ? 'للاستخدام عند الحاجة فقط. تُسجّل هويتك والسبب ورقم التذكرة قبل فتح الملف لمدة تصل إلى خمس دقائق.' : 'Use only when necessary. Your identity, reason, and case reference are recorded before the profile opens for up to five minutes.'}
      </p>
      <form onSubmit={e => void open(e)} className="space-y-3">
        <fieldset disabled={busy} className="grid min-w-0 gap-3 sm:grid-cols-3">
          <label className="min-w-0 text-xs font-semibold text-slate-300">
            {isAr ? 'معرّف حساب العميل' : 'Client account ID'}
            <input className={field} dir="ltr" value={target} maxLength={128} required spellCheck={false} onChange={e => setTarget(e.target.value)} />
          </label>
          <label className="min-w-0 text-xs font-semibold text-slate-300">
            {isAr ? 'سبب المراجعة' : 'Reason for review'}
            <select className={field} value={reason} required onChange={e => setReason(e.target.value as AccountReviewReason | '')}>
              <option value="">{isAr ? 'اختر السبب' : 'Select a reason'}</option>
              {ACCOUNT_REVIEW_REASONS.map(value => <option key={value} value={value}>{reasons[value][language]}</option>)}
            </select>
          </label>
          <label className="min-w-0 text-xs font-semibold text-slate-300">
            {isAr ? 'رقم تذكرة الدعم (بدون بيانات شخصية)' : 'Case reference (no personal data)'}
            <input className={field} dir="ltr" value={caseId} minLength={4} maxLength={40} placeholder="CASE-101" required onChange={e => setCaseId(e.target.value)} />
          </label>
        </fieldset>
        <button type="submit" disabled={busy} className="rounded-lg bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-50">
          {busy ? (isAr ? 'جارٍ التنفيذ…' : 'Working…') : (isAr ? 'سجّل السبب وافتح الملف' : 'Record reason and open profile')}
        </button>
      </form>
      {error && <p role="alert" className="text-xs text-rose-200">{error}</p>}
      {status && <p role="status" className="text-xs text-emerald-200">{status}</p>}
      {view && (
        <div className="space-y-3 rounded-xl border border-slate-700 bg-slate-950 p-4 text-xs text-slate-200">
          <div className="flex items-start justify-between gap-2">
            <p className="break-words text-sm font-bold text-white">{view.account.fullName} · {view.account.organizationName}</p>
            <button type="button" onClick={() => setView(null)} className="shrink-0 text-cyan-300 underline">{isAr ? 'إخفاء الملف' : 'Hide profile'}</button>
          </div>
          <dl className="grid gap-2 sm:grid-cols-2">
            {[
              [isAr ? 'البريد' : 'Email', view.account.email], [isAr ? 'الهاتف' : 'Phone', view.account.phone],
              [isAr ? 'الكود المطلوب' : 'Requested company code', view.account.requestedCompanyCode],
              [isAr ? 'كود الشركة المرتبط' : 'Linked company code', view.account.assignedCompanyCode],
            ].filter(([, value]) => Boolean(value)).map(([label, value]) => (
              <div key={label} className="min-w-0"><dt className="text-slate-400">{label}</dt><dd className="break-all"><bdi>{value}</bdi></dd></div>
            ))}
          </dl>
          {canLinkCompany && view.reason === 'company_link' && (
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-slate-300">
                {isAr ? 'الشركة المطلوب ربطها' : 'Company to link'}
                <select className={field} value={companyId} onChange={e => setCompanyId(e.target.value)}>
                  <option value="">{isAr ? 'اختر شركة' : 'Select a company'}</option>
                  {companies.map(company => <option key={company.id} value={company.id}>{company.companyCode} · {isAr ? company.nameAr : company.nameEn}</option>)}
                </select>
              </label>
              <button type="button" disabled={busy || !companyId} onClick={() => void link()} className="rounded-lg bg-emerald-500 px-3 py-2 font-bold text-slate-950 disabled:opacity-50">
                {isAr ? 'اعتماد وربط الكود' : 'Approve and link company'}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
