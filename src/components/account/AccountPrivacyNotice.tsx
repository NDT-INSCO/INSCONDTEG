import { ShieldCheck } from 'lucide-react';
import type { Language } from '../../types';

export function AccountPrivacyNotice({ language }: { language: Language }) {
  return (
    <div className="space-y-1.5 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-xs text-slate-300">
      <p className="leading-relaxed">
        {language === 'ar'
          ? 'ملفك خاص. عند الحاجة، ممكن لموظف مخوّل يراجعه لسبب مسجّل، من غير إرسال إشعار عند كل مراجعة.'
          : 'Your profile is private. When needed, authorized staff may review it for a recorded reason, without a notification for each review.'}
      </p>
      <details>
        <summary className="cursor-pointer font-semibold text-slate-100">
          <ShieldCheck className="me-1.5 inline h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
          {language === 'ar' ? 'خصوصية الحساب' : 'Account privacy'}
        </summary>
        <p className="mt-2 leading-relaxed">
          {language === 'ar'
            ? 'بيانات ملفك غير معروضة للأعضاء الآخرين. تُنقل عبر اتصال مشفّر وتُخزّن في قاعدة بيانات مشفّرة. ما تختار نشره في المجتمع والبيانات اللي تشاركها لإنجاز طلب خدمة لها نطاق مشاركة مختلف.'
            : 'Other members cannot see your private profile. It is sent over an encrypted connection and stored in an encrypted database. Content you publish and information you share to fulfill a service request have different audiences.'}
        </p>
      </details>
    </div>
  );
}
