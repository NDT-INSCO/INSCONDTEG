import React, { useState } from 'react';
import { Check, Eye, LoaderCircle, Megaphone, Save } from 'lucide-react';
import { AdminApiError } from '../../admin/client';
import { useAdminClient } from '../../admin/connection';
import { NOTICE_LIMIT } from '../../admin/contract';
import type { Announcement } from '../../admin/contract';
import type { Language } from '../../types';
import { adminError, AdminMessage, numberText, shortDate } from './AdminUi';

export function AdminAnnouncement({ language, initial, onSessionError, onSaved }: {
  language: Language;
  initial: Announcement;
  onSessionError: (error: unknown) => boolean;
  onSaved: (announcement: Announcement) => void;
}) {
  const adminClient = useAdminClient();
  const ar = language === 'ar';
  const [draft, setDraft] = useState(initial);
  const [baseline, setBaseline] = useState(initial);
  const [previewLanguage, setPreviewLanguage] = useState<Language>(language);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const changed = draft.enabled !== baseline.enabled || draft.message.ar !== baseline.message.ar || draft.message.en !== baseline.message.en;
  const visibility = !draft.enabled ? (ar ? 'مخفي للزوّار' : 'Hidden from visitors')
    : changed ? (ar ? 'ظاهر بعد الحفظ' : 'Visible on save') : (ar ? 'منشور الآن' : 'Published');

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving || !changed) return;
    if (draft.enabled && (!draft.message.ar.trim() || !draft.message.en.trim())) {
      setError(new AdminApiError('invalid_announcement'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const announcement = await adminClient.saveAnnouncement({ enabled: draft.enabled, message: draft.message });
      setDraft(announcement);
      setBaseline(announcement);
      setSaved(true);
      onSaved(announcement);
    } catch (cause) {
      if (!onSessionError(cause)) setError(cause);
    } finally {
      setSaving(false);
    }
  }

  function edit(next: Announcement) {
    setDraft(next);
    setSaved(false);
    setError(null);
  }

  return (
    <div className="ad-editor-grid">
      <section className="ad-panel">
        <div className="ad-panel-heading"><div><h2><Megaphone size={20} aria-hidden="true" />{ar ? 'إعلان الصفحة الرئيسية' : 'Homepage announcement'}</h2><p>{ar ? 'انشر رسالة قصيرة لزوّار صفحة الشركة أو احتفظ بها كمسودة.' : 'Publish a short message to company-site visitors or keep it as a draft.'}</p></div></div>
        <form className="ad-form-stack ad-announcement-form" onSubmit={save}>
          <label className="ad-switch-row">
            <span><strong>{ar ? 'إظهار الإعلان للزوّار' : 'Show announcement to visitors'}</strong><small>{ar ? 'يظهر أعلى الصفحة الرئيسية بعد الحفظ.' : 'Appears above the homepage hero once saved.'}</small></span>
            <input role="switch" type="checkbox" className="ad-switch" checked={draft.enabled} disabled={saving} onChange={event => edit({ ...draft, enabled: event.target.checked })} />
          </label>
          {(['ar', 'en'] as const).map(locale => (
            <label className="ad-announcement-field" key={locale}>
              <span>{locale === 'ar' ? (ar ? 'نص الإعلان بالعربية' : 'Arabic announcement') : (ar ? 'نص الإعلان بالإنجليزية' : 'English announcement')}</span>
              <textarea className="ad-input" rows={3} dir={locale === 'ar' ? 'rtl' : 'ltr'} lang={locale}
                maxLength={NOTICE_LIMIT} disabled={saving} value={draft.message[locale]}
                placeholder={locale === 'ar' ? 'اكتب رسالة قصيرة للزوّار…' : 'Write a short message for visitors…'}
                onChange={event => edit({ ...draft, message: { ...draft.message, [locale]: event.target.value } })}
              />
              <small className="ad-counter" dir="ltr">{numberText(draft.message[locale].length, language)} / {numberText(NOTICE_LIMIT, language)}</small>
            </label>
          ))}
          {error != null && <AdminMessage>{adminError(error, language)}</AdminMessage>}
          {saved && <AdminMessage error={false}>{baseline.enabled ? (ar ? 'تم نشر الإعلان على الموقع.' : 'The announcement is now published.') : (ar ? 'تم الحفظ. الإعلان غير ظاهر للزوّار.' : 'Saved. The announcement is hidden from visitors.')}</AdminMessage>}
          <div className="ad-save-row">
            <button type="submit" className="ad-button ad-primary" disabled={saving || !changed}>{saving ? <LoaderCircle size={17} className="ad-spin" aria-hidden="true" /> : <Save size={17} aria-hidden="true" />}{ar ? 'حفظ الإعلان' : 'Save announcement'}</button>
            {baseline.updatedAt && <small>{ar ? 'آخر حفظ:' : 'Last saved:'} <time dateTime={baseline.updatedAt}>{shortDate(baseline.updatedAt, language, { dateStyle: 'medium', timeStyle: 'short' })}</time></small>}
          </div>
        </form>
      </section>
      <section className="ad-panel ad-preview-panel">
        <div className="ad-panel-heading"><div><h2><Eye size={20} aria-hidden="true" />{ar ? 'معاينة الإعلان' : 'Announcement preview'}</h2><p>{ar ? 'كيف ستبدو الرسالة عند النشر' : 'See how the message will look'}</p></div></div>
        <div className="ad-preview-tools">
          <span className={`ad-neutral-tag ${draft.enabled ? 'is-enabled' : ''}`}>{draft.enabled && <Check size={13} aria-hidden="true" />}{visibility}</span>
          <div className="ad-preview-langs" aria-label={ar ? 'لغة المعاينة' : 'Preview language'} role="group">
            <button type="button" aria-pressed={previewLanguage === 'ar'} onClick={() => setPreviewLanguage('ar')} lang="ar">ع</button>
            <button type="button" aria-pressed={previewLanguage === 'en'} onClick={() => setPreviewLanguage('en')} lang="en">EN</button>
          </div>
        </div>
        <div className="ad-notice-preview" dir={previewLanguage === 'ar' ? 'rtl' : 'ltr'} lang={previewLanguage}>
          <Megaphone size={20} aria-hidden="true" /><p>{draft.message[previewLanguage].trim() || (previewLanguage === 'ar' ? 'سيظهر نص الإعلان هنا.' : 'Your announcement will appear here.')}</p>
        </div>
      </section>
    </div>
  );
}
