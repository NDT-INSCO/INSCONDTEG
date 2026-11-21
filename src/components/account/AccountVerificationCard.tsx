import { LogOut, MailCheck, RefreshCw } from 'lucide-react';
import { useSiteAccount } from '../../account/SiteAccountContext';
import { formatFirebaseAuthError } from '../../client/firestoreClientService';
import type { Language } from '../../types';

export function AccountVerificationCard({ language, client = false }: { language: Language; client?: boolean }) {
  const account = useSiteAccount();
  const isAr = language === 'ar';
  const { user, action, notice, checking, delivery, draft } = account;
  if (!user) return null;
  const failed = notice?.status === 'error' || (!notice && delivery?.status === 'failed');
  const message = notice?.status === 'error' ? formatFirebaseAuthError(notice.error, language)
    : notice?.status === 'unverified'
      ? isAr ? 'لم يكتمل تفعيل البريد بعد. افتح رابط التفعيل ثم حاول مرة أخرى.' : 'Email activation has not completed. Open the verification link and try again.'
    : notice?.status === 'resent' || delivery?.status === 'sent'
      ? isAr ? 'تم إرسال رابط التفعيل. راجع الوارد والبريد غير المرغوب فيه.' : 'Verification link sent. Check your inbox and spam folder.'
    : delivery?.status === 'failed'
      ? `${isAr ? 'لم يُرسل رابط التفعيل.' : 'Verification email was not sent.'} ${formatFirebaseAuthError(delivery.error, language)}`
    : delivery?.status === 'sending'
      ? isAr ? 'جارٍ إرسال رابط التفعيل…' : 'Sending verification email…'
    : null;
  const controls = 'inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold cursor-pointer disabled:cursor-wait disabled:opacity-50';

  return (
    <section className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-amber-500/40 bg-slate-900 p-5 sm:p-7">
      <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
        <MailCheck className="h-4 w-4" aria-hidden="true" />
        {isAr ? 'التحقّق من الحساب' : 'Verify Your Account'}
      </div>
      <h2 className="text-xl font-black text-white">
        {client
          ? isAr ? 'أكد حسابك قبل استخدام بوابة العملاء' : 'Verify your account to use the Client Portal'
          : isAr ? 'فعّل حساب إنسكو الموحد' : 'Verify your INSCO account'}
      </h2>
      <p className="text-sm leading-relaxed text-slate-300">
        {user.email
          ? isAr
            ? <>افتح رابط التفعيل في بريدك <bdi className="break-all">{user.email}</bdi>، ثم اضغط «تحقق من التفعيل».</>
            : <>Open the verification link for <bdi className="break-all">{user.email}</bdi>, then select “Check verification”.</>
          : isAr ? 'أعد التحقق من الجلسة أو ادخل بالطريقة التي وثّقت بها حسابك.' : 'Check your session again or use the method you verified.'}
      </p>
      {draft && (
        <p className="text-xs text-amber-200">
          {isAr ? 'لخصوصيتك، المسودة في ذاكرة التبويب فقط. افتح رابط التفعيل في تبويب آخر وارجع هنا قبل تحديث الصفحة أو إغلاقها.' : 'For your privacy the draft stays in this tab’s memory. Open the verification link separately and return here before reloading or closing the tab.'}
        </p>
      )}
      {message && <p role={failed ? 'alert' : 'status'} className={`text-xs ${failed ? 'text-rose-200' : 'text-emerald-200'}`}>{message}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" className={`${controls} bg-amber-500 text-slate-950`} disabled={Boolean(action || checking)} onClick={() => void account.refreshVerification()}>
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          {action === 'refresh' || checking ? (isAr ? 'جارٍ التحقق…' : 'Checking…') : (isAr ? 'تحقق من التفعيل' : 'Check verification')}
        </button>
        {user.email && (
          <button type="button" className={`${controls} border border-slate-700 text-slate-200`} disabled={Boolean(action || checking || delivery?.status === 'sending')} onClick={() => void account.resendVerification()}>
            {isAr ? 'أعد إرسال رابط التفعيل' : 'Resend verification email'}
          </button>
        )}
        <button type="button" className={`${controls} border border-slate-700 text-slate-200`} disabled={Boolean(action)} onClick={() => void account.signOut()}>
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          {isAr ? 'تسجيل الخروج' : 'Sign Out'}
        </button>
      </div>
    </section>
  );
}
