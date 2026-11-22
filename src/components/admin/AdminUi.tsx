import React from 'react';
import { ArrowLeft, Building2, CircleAlert, Inbox, LoaderCircle } from 'lucide-react';
import { AdminApiError } from '../../admin/client';
import { ADMIN_HASH, type QuoteStatus, type QuoteSummary } from '../../admin/contract';
import type { Language } from '../../types';

export function AdminBrand({ language }: { language: Language }) {
  return (
    <div className="ad-brand">
      <span className="ad-brand-mark"><Building2 size={22} aria-hidden="true" /></span>
      <div><strong lang="en" dir="ltr">INSCO<span>.</span></strong><small>{language === 'ar' ? 'مركز عمليات الموقع' : 'Site operations'}</small></div>
    </div>
  );
}

export function BackIcon() {
  return <ArrowLeft size={16} className="ad-directional" aria-hidden="true" />;
}

export function AdminLoading({ language }: { language: Language }) {
  return <div className="ad-loading" role="status"><LoaderCircle size={18} className="ad-spin" aria-hidden="true" />{language === 'ar' ? 'جارٍ التحميل…' : 'Loading…'}</div>;
}

export function AdminMessage({ children, error = true }: { children: React.ReactNode; error?: boolean }) {
  return <div className={`ad-message ${error ? 'is-error' : 'is-success'}`} role={error ? 'alert' : 'status'}>{error && <CircleAlert size={16} aria-hidden="true" />}<div>{children}</div></div>;
}

export function PasskeyNewTab({ language }: { language: Language }) {
  const ar = language === 'ar';
  return <p className="ad-passkey-tip">{ar ? 'لاستخدام مفتاح المرور، ' : 'To use a passkey, '}<a href={ADMIN_HASH} target="_blank" rel="noopener noreferrer">{ar ? 'افتح البوابة في تبويب مستقل' : 'open the portal in its own tab'}</a>.</p>;
}

export function adminError(error: unknown, language: Language): string {
  const ar = language === 'ar';
  const generic = ar ? 'تعذّر إتمام العملية. تحقق من الاتصال وحاول مرة أخرى.' : 'Could not complete the request. Check your connection and try again.';
  if (!(error instanceof AdminApiError)) return generic;
  switch (error.code) {
    case 'invalid_credentials':
    case 'invalid_pin': return ar ? 'كلمة المرور غير صحيحة.' : 'The password is incorrect.';
    case 'rate_limited': {
      const minutes = Math.max(1, Math.ceil(error.retryAfter / 60));
      return ar ? `محاولات كثيرة. حاول مجددًا بعد ${numberText(minutes, language)} دقيقة.` : `Too many attempts. Try again in ${minutes} min.`;
    }
    case 'cookies_blocked': return ar
      ? 'لم يتعرّف الخادم على جلسة الدخول. افتح البوابة في تبويب مستقل وتأكد من السماح بملفات تعريف الارتباط.'
      : 'The server did not recognise your session. Open the portal in its own tab and allow cookies.';
    case 'not_configured': return ar ? 'خادم الإدارة غير مهيّأ لتسجيل الدخول. تواصل مع مسؤول تشغيل الموقع.' : 'The admin server is not configured for sign-in. Contact the site operator.';
    case 'origin_not_allowed': return ar ? 'افتح البوابة من عنوانها المعتمد ثم حاول مجددًا.' : 'Open the portal at its configured address and try again.';
    case 'storage_error': return ar ? 'تعذّر الوصول إلى قاعدة بيانات الإدارة. حاول مجددًا بعد قليل.' : 'The admin database is unavailable. Try again shortly.';
    case 'invalid_response': return ar ? 'هذا العنوان لم يُرجع ردًا صالحًا من خادم الإدارة. تأكد من أنك تستخدم الرابط المعتمد.' : 'This address did not return a valid admin response. Check that you are using the configured address.';
    case 'timeout': return ar ? 'استغرق رد خادم الإدارة وقتًا طويلًا. حاول مرة أخرى.' : 'The admin server took too long to respond. Try again.';
    case 'passkey_browser': return ar ? 'مفاتيح المرور غير متاحة في هذا المتصفح. استخدم كلمة المرور.' : 'Passkeys are unavailable in this browser. Use your password.';
    case 'passkey_prompt_failed': return ar ? 'لم يكتمل التحقق على جهازك. حاول مجددًا أو استخدم كلمة المرور.' : 'Device verification did not complete. Try again or use your password.';
    case 'passkey_challenge_expired': return ar ? 'انتهت مهلة التحقق. ابدأ المحاولة مرة أخرى في تبويب مستقل.' : 'The verification attempt expired. Start again in the portal’s own tab.';
    case 'passkey_verification_failed': return ar ? 'تعذّر الدخول بهذا المفتاح. جرّب مفتاحًا مسجّلًا أو استخدم كلمة المرور.' : 'This passkey did not sign you in. Try a registered passkey or use your password.';
    case 'passkey_registration_failed': return ar ? 'تعذّر حفظ مفتاح المرور. حاول إضافة المفتاح مرة أخرى.' : 'The passkey could not be saved. Try adding it again.';
    case 'passkey_not_configured': return ar ? 'مفاتيح المرور غير مهيّأة على هذا العنوان.' : 'Passkeys are not configured at this address.';
    case 'no_passkeys': return ar ? 'لا يوجد مفتاح مرور مسجّل. ادخل بكلمة المرور لإضافة مفتاح.' : 'No passkey is registered. Sign in with your password to add one.';
    case 'passkey_password_required': return ar ? 'سجّل الخروج ثم ادخل بكلمة المرور لإدارة مفاتيح المرور.' : 'Sign out and sign in with your password to manage passkeys.';
    case 'passkey_exists': return ar ? 'مفتاح المرور هذا مسجّل بالفعل.' : 'This passkey is already registered.';
    case 'passkey_limit': return ar ? 'تم الوصول إلى الحد الأقصى. احذف مفتاحًا قبل إضافة آخر.' : 'The passkey limit is reached. Remove a passkey before adding another.';
    case 'passkey_not_found': return ar ? 'مفتاح المرور لم يعد مسجّلًا.' : 'This passkey is no longer registered.';
    case 'invalid_announcement': return ar ? 'أضف نصًا في اللغتين قبل النشر والتزم بحد الأحرف.' : 'Add a message in both languages before publishing and stay within the character limit.';
    case 'quote_not_found': return ar ? 'هذا الطلب غير موجود.' : 'This request was not found.';
    default: return generic;
  }
}

export function numberText(value: number, language: Language): string {
  return new Intl.NumberFormat(language === 'ar' ? 'ar-EG-u-nu-latn' : 'en').format(value);
}

export function shortDate(value: string, language: Language, format: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
  return new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en-GB', format).format(new Date(value));
}

export const STATUS_COPY: Record<QuoteStatus, { ar: string; en: string }> = {
  new: { ar: 'جديد', en: 'New' },
  in_progress: { ar: 'قيد المتابعة', en: 'In follow-up' },
  closed: { ar: 'مغلق', en: 'Closed' },
};

export function QuoteStatusPill({ status, language }: { status: QuoteStatus; language: Language }) {
  return <span className={`ad-status ad-status-${status}`}><span className="ad-dot" />{STATUS_COPY[status][language]}</span>;
}

export function EmptyQuotes({ filtered, language }: { filtered?: boolean; language: Language }) {
  const ar = language === 'ar';
  return (
    <div className="ad-empty">
      <span className="ad-empty-icon"><Inbox size={22} aria-hidden="true" /></span>
      <strong>{filtered ? (ar ? 'لا توجد نتائج مطابقة' : 'No matching requests') : (ar ? 'لا توجد طلبات بعد' : 'No requests yet')}</strong>
      <p>{filtered
        ? (ar ? 'جرّب تعديل كلمة البحث أو اختيار حالة أخرى.' : 'Try a different search or status.')
        : (ar ? 'تظهر هنا الطلبات التي يستقبلها نموذج عرض السعر عبر هذا الخادم.' : 'Requests accepted by this server’s quote form will appear here.')}</p>
    </div>
  );
}

const SERVICES: Record<string, { ar: string; en: string }> = {
  general: { ar: 'استفسار عام', en: 'General enquiry' },
  pwht: { ar: 'المعالجة الحرارية', en: 'Heat treatment' },
  ndt: { ar: 'الفحص غير الإتلافي', en: 'NDT inspection' },
  ut_paut: { ar: 'فحص UT / PAUT', en: 'Ultrasonic & phased array' },
  rt_gamma: { ar: 'التصوير الإشعاعي', en: 'Radiographic testing' },
  mt_pt: { ar: 'الفحوصات السطحية', en: 'Surface testing' },
  pmi_hardness: { ar: 'تحليل السبائك والصلادة', en: 'Alloy analysis & hardness' },
  hydro: { ar: 'اختبار هيدروستاتيكي', en: 'Hydrostatic testing' },
  manpower: { ar: 'توريد عمالة فنية', en: 'Technical manpower' },
  prequal: { ar: 'تسجيل مورد معتمد', en: 'Vendor registration' },
};

export function serviceText(service: string, language: Language): string {
  return Object.prototype.hasOwnProperty.call(SERVICES, service) ? SERVICES[service][language] : service;
}

export function QuoteTable({ items, language, onOpen }: { items: QuoteSummary[]; language: Language; onOpen: (reference: string) => void }) {
  const ar = language === 'ar';
  return (
    <div className="ad-table-scroll" tabIndex={0} role="region" aria-label={ar ? 'جدول الطلبات' : 'Requests table'}>
      <table className="ad-table" role="table">
        <thead role="rowgroup"><tr role="row">
          <th scope="col">{ar ? 'الشركة / المرجع' : 'Company / reference'}</th>
          <th scope="col">{ar ? 'الخدمة' : 'Service'}</th>
          <th scope="col">{ar ? 'الاستلام' : 'Received'}</th>
          <th scope="col">{ar ? 'الحالة' : 'Status'}</th>
          <th scope="col" className="ad-table-action">{ar ? 'التفاصيل' : 'Details'}</th>
        </tr></thead>
        <tbody role="rowgroup">{items.map(item => (
          <tr key={item.reference} role="row">
            <th role="rowheader" scope="row"><bdi>{item.companyName}</bdi><small dir="ltr">{item.reference}</small></th>
            <td className="ad-cell-service" role="cell"><bdi>{serviceText(item.serviceType, language)}</bdi></td>
            <td className="ad-cell-date" role="cell"><time dateTime={item.receivedAt}>{shortDate(item.receivedAt, language)}</time></td>
            <td className="ad-cell-status" role="cell"><QuoteStatusPill status={item.status} language={language} /></td>
            <td className="ad-table-action" role="cell"><button type="button" className="ad-text-button" onClick={() => onOpen(item.reference)} aria-label={`${ar ? 'عرض الطلب' : 'View request'} ${item.reference}`}>{ar ? 'عرض التفاصيل' : 'View details'}</button></td>
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
