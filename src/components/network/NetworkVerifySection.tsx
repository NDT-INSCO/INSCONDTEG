import React, { useCallback, useEffect, useState } from 'react';
import {
  BadgeCheck,
  Building2,
  Check,
  CircleAlert,
  Flag,
  Loader2,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { Language } from '../../types';
import type {
  CommunityCompany,
  CommunityReport,
  CommunityVerification,
  CommunityWorkspaceProfile,
  VerificationTrack,
} from '../../client/types';
import { useOptionalSiteAccount } from '../../account/SiteAccountContext';
import { useTheme } from '../../utils/themeStore';
import { networkSurface } from './networkTheme';
import { VerificationTrackBadges } from './NetworkBadges';
import { isVerifiedAdminUser } from '../../client/firestoreClientService';

interface NetworkVerifySectionProps {
  language: Language;
  onOpenAccount: (panel: 'signin' | 'account') => void;
  onOpenProfile: () => void;
}

export const NetworkVerifySection: React.FC<NetworkVerifySectionProps> = ({
  language,
  onOpenAccount,
  onOpenProfile,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const s = networkSurface(isLight);
  const account = useOptionalSiteAccount();

  const serviceReady = account?.available ?? false;
  const uid = account?.user?.uid ?? null;
  const verifiedEmail = account?.verified ?? false;
  const isAdmin = isVerifiedAdminUser(account?.user ?? null);

  const [card, setCard] = useState<CommunityWorkspaceProfile | null>(null);
  const [companies, setCompanies] = useState<CommunityCompany[]>([]);
  const [myRequests, setMyRequests] = useState<CommunityVerification[]>([]);
  const [adminRequests, setAdminRequests] = useState<CommunityVerification[]>([]);
  const [adminReports, setAdminReports] = useState<CommunityReport[]>([]);

  // Verification submission form
  const [track, setTrack] = useState<VerificationTrack>('identity');
  const [subjectTitle, setSubjectTitle] = useState('');
  const [issuerOrCompany, setIssuerOrCompany] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedOk, setSubmittedOk] = useState(false);

  // Moderation report submission
  const [reportTargetTitle, setReportTargetTitle] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportOk, setReportOk] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceReady) return;
    let active = true;
    const unsubs: Array<() => void> = [];

    if (uid) {
      void import('../../client/firestoreClientService').then(api => {
        if (!active) return;
        unsubs.push(
          api.subscribeMyCommunityWorkspace(
            uid,
            next => {
              if (active) setCard(next);
            },
            () => {}
          )
        );
      });
    }

    void import('../../client/networkPlatformService').then(api => {
      if (!active) return;
      unsubs.push(api.subscribeCommunityCompanies(list => active && setCompanies(list), () => {}));
      if (uid) {
        unsubs.push(api.subscribeMyVerifications(uid, rows => active && setMyRequests(rows), () => {}));
      }
      if (isAdmin) {
        unsubs.push(api.subscribeAllVerificationsAdmin(rows => active && setAdminRequests(rows), () => {}));
        unsubs.push(api.subscribeModerationReportsAdmin(rows => active && setAdminReports(rows), () => {}));
      }
    });

    return () => {
      active = false;
      unsubs.forEach(u => u());
    };
  }, [isAdmin, serviceReady, uid]);

  const submitRequest = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const user = account?.user;
      if (!user || !card || subjectTitle.trim().length < 3 || evidenceNote.trim().length < 5) return;
      setSubmitting(true);
      setError(null);
      setSubmittedOk(false);
      try {
        const api = await import('../../client/networkPlatformService');
        await api.submitVerificationRequest(user, {
          memberName: card.displayName,
          track,
          subjectTitle: subjectTitle.trim(),
          issuerOrCompany: issuerOrCompany.trim() || card.organizationName,
          evidenceNote: evidenceNote.trim(),
          ...(evidenceUrl.trim().startsWith('https://') ? { evidenceUrl: evidenceUrl.trim() } : {}),
          ...(track === 'organization' && companyId ? { companyId } : {}),
        });
        setSubjectTitle('');
        setIssuerOrCompany('');
        setEvidenceNote('');
        setEvidenceUrl('');
        setSubmittedOk(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setSubmitting(false);
      }
    },
    [account?.user, card, companyId, evidenceNote, evidenceUrl, issuerOrCompany, subjectTitle, track]
  );

  const handleReview = useCallback(
    async (verif: CommunityVerification, status: 'approved' | 'rejected') => {
      try {
        const api = await import('../../client/networkPlatformService');
        await api.reviewVerificationAdmin(verif, status);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    []
  );

  const handleReportStatus = useCallback(
    async (reportId: string, status: CommunityReport['status']) => {
      try {
        const api = await import('../../client/networkPlatformService');
        await api.updateModerationReportStatus(reportId, status);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    []
  );

  const submitGeneralReport = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const user = account?.user;
      if (!user || !card || reportTargetTitle.trim().length < 3 || reportReason.trim().length < 5) return;
      try {
        const api = await import('../../client/networkPlatformService');
        await api.submitModerationReport(user, {
          reporterName: card.displayName,
          targetType: 'user',
          targetId: 'community-moderation',
          targetTitle: reportTargetTitle.trim(),
          reason: reportReason.trim(),
        });
        setReportTargetTitle('');
        setReportReason('');
        setReportOk(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    },
    [account?.user, card, reportReason, reportTargetTitle]
  );

  const canSubmit = Boolean(uid && verifiedEmail && card);

  return (
    <div data-testid="network-section-verify" className="min-w-0 space-y-3">
      {/* Three-track integrity overview */}
      <div className={`${s.card} p-3`}>
        <h2 className={`flex items-center gap-2 text-base font-bold ${s.heading}`}>
          <ShieldCheck className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
          {isAr ? 'التحقق المهني والحوكمة — 3 مسارات مستقلة' : 'INSCO Verification & Governance — 3 Independent Tracks'}
        </h2>
        <p className={`mt-1 text-[11px] leading-relaxed ${s.subtext}`}>
          {isAr
            ? 'لا تُمنح أي شارة تلقائياً ولا بواسطة الذكاء الاصطناعي. كل مسار يبدأ بحالة قيد المراجعة ويُعتمد من فريق التحقق بعد مراجعة المستندات.'
            : 'No badge is ever granted automatically or by AI. Every request starts as pending and is reviewed by INSCO governance.'}
        </p>

        <div className="mt-3 grid gap-2.5 md:grid-cols-3">
          <div className={`${s.subCard} p-2.5`}>
            <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              {isAr ? 'التحقق من الهوية' : 'Identity Verification'}
            </div>
            <p className={`mt-1 text-[10px] leading-relaxed ${s.subtext}`}>
              {isAr ? 'يطابق الاسم الحقيقي والهوية المهنية بالوثائق الرسمية.' : 'Matches full name and identity against official documentation.'}
            </p>
          </div>
          <div className={`${s.subCard} p-2.5`}>
            <div className="flex items-center gap-1.5 text-xs font-bold text-violet-400">
              <Building2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              {isAr ? 'التحقق من المؤسسة' : 'Organization Verification'}
            </div>
            <p className={`mt-1 text-[10px] leading-relaxed ${s.subtext}`}>
              {isAr ? 'يتحقق من صفة الشركة أو المختبر الهندسي ومسؤول الصفحة.' : 'Verifies corporate/lab registration and official page ownership.'}
            </p>
          </div>
          <div className={`${s.subCard} p-2.5`}>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              {isAr ? 'التحقق من المؤهل' : 'Credential Verification'}
            </div>
            <p className={`mt-1 text-[10px] leading-relaxed ${s.subtext}`}>
              {isAr ? 'مراجعة شهادات ASNT / ISO 9712 / PCN / CSWIP لدى جهة الإصدار.' : 'Reviews ASNT, ISO 9712, PCN, and CSWIP certificates with issuer records.'}
            </p>
          </div>
        </div>

        {card ? (
          <div className={`mt-3 flex flex-wrap items-center gap-2 border-t pt-2.5 ${s.divider}`}>
            <span className={`text-[11px] font-bold ${s.heading}`}>
              {isAr ? 'شاراتك الحالية:' : 'Your current badges:'}
            </span>
            <VerificationTrackBadges profile={card} language={language} isLight={isLight} />
            {!card.identityVerified && !card.organizationVerified && !card.credentialVerified ? (
              <span className={`text-[10px] ${s.subtext}`}>
                {isAr ? 'لا توجد شارات معتمدة بعد.' : 'No verified tracks approved yet.'}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {!serviceReady ? (
        <div className={`${s.card} p-4 text-xs ${s.subtext}`}>
          <CircleAlert className="mb-1 inline h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />{' '}
          {isAr ? 'تقديم طلبات التحقق يعمل عند تفعيل اتصال قاعدة البيانات.' : 'Verification requests require active database setup.'}
        </div>
      ) : !canSubmit ? (
        <div className={`${s.card} p-4`}>
          <p className={`text-xs ${s.subtext}`}>
            {!uid
              ? isAr ? 'سجّل الدخول لرفع طلب تحقق لهويتك أو شهادتك.' : 'Sign in to submit an identity, organization, or credential verification request.'
              : !verifiedEmail
                ? isAr ? 'أكّد بريدك أولاً قبل إرسال طلب التحقق.' : 'Confirm your email before submitting a verification request.'
                : isAr ? 'أنشئ بطاقتك المهنية أولاً لربط الطلب بملفك.' : 'Create your professional card first to link verification.'}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {!uid ? (
              <button type="button" onClick={() => onOpenAccount('signin')} className={s.buttonPrimary}>
                {isAr ? 'تسجيل الدخول' : 'Sign in'}
              </button>
            ) : !verifiedEmail ? (
              <button type="button" onClick={() => onOpenAccount('account')} className={s.buttonPrimary}>
                {isAr ? 'تأكيد البريد' : 'Confirm email'}
              </button>
            ) : (
              <button type="button" onClick={onOpenProfile} className={s.buttonPrimary}>
                {isAr ? 'إنشاء بطاقتي' : 'Create my card'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {/* Submit verification request */}
          <form onSubmit={submitRequest} className={`${s.card} space-y-2.5 p-3`}>
            <h3 className={`text-xs font-bold ${s.heading}`}>
              {isAr ? 'تقديم طلب تحقق جديد' : 'Submit Verification Request'}
            </h3>
            {error ? <p className="text-[10px] text-rose-400">{error}</p> : null}
            {submittedOk ? (
              <p role="status" className="text-[10px] font-bold text-emerald-400">
                {isAr ? 'تم تسجيل طلبك بحالة «قيد المراجعة».' : 'Request logged with status: pending.'}
              </p>
            ) : null}

            <select
              value={track}
              onChange={e => setTrack(e.target.value as VerificationTrack)}
              className={s.input}
              aria-label={isAr ? 'مسار التحقق' : 'Verification track'}
            >
              <option value="identity">{isAr ? 'التحقق من الهوية' : 'Identity Track'}</option>
              <option value="organization">{isAr ? 'التحقق من المؤسسة' : 'Organization Track'}</option>
              <option value="credential">{isAr ? 'التحقق من المؤهل / الشهادة' : 'Credential Track'}</option>
            </select>

            {track === 'organization' && companies.length > 0 ? (
              <select
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
                className={s.input}
                aria-label={isAr ? 'الشركة المرتبطة' : 'Associated company'}
              >
                <option value="">{isAr ? 'اختر صفحة المؤسسة (اختياري)' : 'Select organisation page (optional)'}</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{isAr && c.nameAr ? c.nameAr : c.name}</option>
                ))}
              </select>
            ) : null}

            <input
              value={subjectTitle}
              onChange={e => setSubjectTitle(e.target.value)}
              required
              placeholder={
                track === 'credential'
                  ? isAr ? 'مثال: ASNT NDT Level III — UT & RT' : 'e.g. ASNT NDT Level III — UT & RT'
                  : track === 'organization'
                    ? isAr ? 'اسم المؤسسة والسجل التجاري' : 'Company name & registration title'
                    : isAr ? 'الاسم الكامل المطابق للهوية' : 'Full legal name for identity check'
              }
              className={s.input}
            />
            <input
              value={issuerOrCompany}
              onChange={e => setIssuerOrCompany(e.target.value)}
              placeholder={isAr ? 'جهة الإصدار أو الشركة (ASNT, PCN, TWI…)' : 'Issuing body or company (ASNT, PCN, TWI…)'}
              className={s.input}
            />
            <textarea
              value={evidenceNote}
              onChange={e => setEvidenceNote(e.target.value)}
              required
              rows={3}
              placeholder={
                isAr
                  ? 'رقم الشهادة / رابط التحقق لدى الجهة المانحة / ملاحظات المراجعة…'
                  : 'Certificate ID, issuer verification reference, or audit note…'
              }
              className={`${s.input} resize-none`}
            />
            <input
              value={evidenceUrl}
              onChange={e => setEvidenceUrl(e.target.value)}
              placeholder="https://... (optional verification link)"
              className={s.input}
            />

            <button
              type="submit"
              disabled={submitting || subjectTitle.trim().length < 3 || evidenceNote.trim().length < 5}
              data-testid="network-verify-submit"
              className={s.buttonPrimary}
            >
              {submitting ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden="true" /> : <Send className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
              {isAr ? 'إرسال للمراجعة' : 'Submit for review'}
            </button>
          </form>

          {/* My requests + community report */}
          <div className="space-y-3">
            <div className={`${s.card} p-3`}>
              <h3 className={`text-xs font-bold ${s.heading}`}>
                {isAr ? `طلباتي السابقة (${myRequests.length})` : `My Verification Requests (${myRequests.length})`}
              </h3>
              {myRequests.length === 0 ? (
                <p className={`mt-2 text-[11px] ${s.subtext}`}>
                  {isAr ? 'لم ترسل أي طلب تحقق بعد.' : 'You have not submitted any verification requests yet.'}
                </p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {myRequests.map(req => (
                    <li key={req.id} className={`${s.subCard} p-2`}>
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className={`text-xs font-bold ${s.heading}`}>{req.subjectTitle}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                            req.status === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : req.status === 'rejected'
                                ? 'bg-rose-500/15 text-rose-400'
                                : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      <p className={`mt-0.5 text-[10px] ${s.subtext}`}>
                        {req.track} · {req.issuerOrCompany}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <form onSubmit={submitGeneralReport} className={`${s.card} space-y-2 p-3`}>
              <h3 className={`flex items-center gap-1.5 text-xs font-bold ${s.heading}`}>
                <Flag className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
                {isAr ? 'إبلاغ عن محتوى أو انتحال صفة' : 'Report Content or Impersonation'}
              </h3>
              {reportOk ? (
                <p className="text-[10px] text-emerald-400">
                  {isAr ? 'تم استلام البلاغ وسيراجعه الفريق.' : 'Report submitted to governance.'}
                </p>
              ) : null}
              <input
                value={reportTargetTitle}
                onChange={e => setReportTargetTitle(e.target.value)}
                required
                placeholder={isAr ? 'اسم الحساب أو المنشور المعني' : 'Account or post subject'}
                className={s.input}
              />
              <textarea
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                required
                rows={2}
                placeholder={isAr ? 'سبب البلاغ…' : 'Reason for moderation review…'}
                className={`${s.input} resize-none`}
              />
              <button type="submit" className={s.buttonSecondary}>
                <Flag className="h-3 w-3 shrink-0" aria-hidden="true" />
                {isAr ? 'إرسال بلاغ' : 'Submit report'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Governance Panel */}
      {isAdmin ? (
        <div data-testid="network-verify-admin" className={`${s.card} space-y-3 border-violet-500/40 p-3`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-xs font-bold text-violet-400">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              {isAr ? 'لوحة حوكمة المسؤول: مراجعة طلبات التحقق والبلاغات' : 'Admin Governance: Verification Queue & Moderation'}
            </h3>
            <span className={s.chip}>
              {isAr ? `${adminRequests.length} طلب · ${adminReports.length} بلاغ` : `${adminRequests.length} requests · ${adminReports.length} reports`}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <p className={`text-[11px] font-bold ${s.heading}`}>
                {isAr ? 'طابور طلبات التحقق' : 'Verification Queue'}
              </p>
              {adminRequests.map(req => (
                <div key={req.id} className={`${s.subCard} space-y-1.5 p-2`}>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className={`text-xs font-bold ${s.heading}`}>{req.memberName} — {req.subjectTitle}</span>
                    <span className={s.chip}>{req.track} · {req.status}</span>
                  </div>
                  <p className={`text-[10px] ${s.subtext}`}>{req.issuerOrCompany} · {req.evidenceNote}</p>
                  {req.status === 'pending' ? (
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleReview(req, 'approved')}
                        className="inline-flex items-center gap-1 rounded border border-emerald-500/50 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400 cursor-pointer"
                      >
                        <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {isAr ? 'اعتماد' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReview(req, 'rejected')}
                        className="inline-flex items-center gap-1 rounded border border-rose-500/50 bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-400 cursor-pointer"
                      >
                        <X className="h-3 w-3 shrink-0" aria-hidden="true" />
                        {isAr ? 'رفض' : 'Reject'}
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="space-y-1.5">
              <p className={`text-[11px] font-bold ${s.heading}`}>
                {isAr ? 'بلاغات الإشراف' : 'Moderation Reports'}
              </p>
              {adminReports.map(rep => (
                <div key={rep.id} className={`${s.subCard} space-y-1.5 p-2`}>
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className={`text-xs font-bold ${s.heading}`}>{rep.targetTitle}</span>
                    <span className={s.chip}>{rep.targetType} · {rep.status}</span>
                  </div>
                  <p className={`text-[10px] ${s.subtext}`}>{rep.reporterName}: {rep.reason}</p>
                  {rep.status === 'open' ? (
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => void handleReportStatus(rep.id, 'action_taken')}
                        className={s.buttonSecondary}
                      >
                        {isAr ? 'تم اتخاذ إجراء' : 'Action taken'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleReportStatus(rep.id, 'dismissed')}
                        className={s.buttonSecondary}
                      >
                        {isAr ? 'إغلاق البلاغ' : 'Dismiss'}
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default NetworkVerifySection;
