import { useEffect, useState, type ReactNode } from 'react';
import { useSiteAccount } from '../../account/SiteAccountContext';
import { bindAccountAcademyProgress } from '../../account/academyAccountProgress';
import type { Language } from '../../types';

/** The shared account never imports the browser's demo learner data. */
export function AcademyAccountScope({ language, children }: { language: Language; children: ReactNode }) {
  const { user, verified } = useSiteAccount();
  const uid = user?.uid ?? null;
  const [bound, setBound] = useState<{ uid: string; verified: boolean; state: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [writeFailed, setWriteFailed] = useState(false);
  useEffect(() => {
    if (!user) { setBound(null); return; }
    setWriteFailed(false);
    const fail = () => setWriteFailed(true);
    const success = () => setWriteFailed(false);
    window.addEventListener('insco_account_progress_save_error', fail);
    window.addEventListener('insco_account_progress_saved', success);
    const stop = bindAccountAcademyProgress(user, verified, state => setBound({ uid: user.uid, verified, state }));
    return () => {
      stop();
      window.removeEventListener('insco_account_progress_save_error', fail);
      window.removeEventListener('insco_account_progress_saved', success);
    };
  }, [user, verified, attempt]);
  const isAr = language === 'ar';
  // Avoid rendering a different account's cached view during a UID change.
  if ((bound?.uid ?? null) !== uid || (bound && bound.verified !== verified)) {
    return <p role="status" className="p-3 text-sm text-slate-300">{isAr ? 'جارٍ فتح تقدّم الحساب…' : 'Opening your account progress…'}</p>;
  }
  const state = bound?.state;
  return (
    <>
      {uid && state !== 'ready' && (
        <p role="status" className="mb-3 rounded-lg border border-amber-500/40 bg-slate-900 px-3 py-2 text-xs text-amber-200">
          {state === 'unverified'
            ? (isAr ? 'فعّل حسابك من «حسابي» عشان تحفظ تقدّم الوحدات والدروس.' : 'Verify your account from “My account” to save module and topic progress.')
            : state === 'error'
              ? (isAr ? 'تعذّر تحميل تقدّم حسابك. لم نستخدم بيانات تجربة من هذا الجهاز.' : 'Could not load your account progress. No local demo records were used.')
              : (isAr ? 'جارٍ تحميل تقدّم حسابك الخاص…' : 'Loading your private account progress…')}
          {state === 'error' && <button type="button" className="ms-2 font-bold underline" onClick={() => setAttempt(n => n + 1)}>{isAr ? 'إعادة المحاولة' : 'Retry'}</button>}
        </p>
      )}
      {writeFailed && uid && <p role="alert" className="mb-3 text-xs text-rose-300">{isAr ? 'لم تُحفظ آخر محاولة لتحديث التقدّم. أعد المحاولة.' : 'Your last progress update was not saved. Please retry.'}</p>}
      <div key={uid ? `account:${uid}` : 'guest'}>{children}</div>
    </>
  );
}
