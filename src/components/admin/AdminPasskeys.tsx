import React, { useEffect, useRef, useState } from 'react';
import { Fingerprint, KeyRound, LoaderCircle, Plus, RotateCw, Trash2 } from 'lucide-react';
import { adminClient, AdminApiError } from '../../admin/client';
import { PASSKEY_LABEL_LIMIT, PASSKEY_LIMIT, type PasskeySettings, type PasskeySummary } from '../../admin/contract';
import { enrollPasskey, passkeyBrowser } from '../../admin/passkeyClient';
import type { Language } from '../../types';
import { AdminLoading, AdminMessage, PasskeyNewTab, adminError, numberText, shortDate } from './AdminUi';

export function AdminPasskeys({ language, onSessionError }: { language: Language; onSessionError: (error: unknown) => boolean }) {
  const ar = language === 'ar';
  const [settings, setSettings] = useState<PasskeySettings | null>(null);
  const [loadError, setLoadError] = useState<unknown>(null);
  const [reload, setReload] = useState(0);
  const [label, setLabel] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState<'added' | 'removed' | null>(null);
  const [working, setWorking] = useState<'add' | 'remove' | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const operation = useRef<AbortController | null>(null);
  const device = passkeyBrowser();

  useEffect(() => {
    const controller = new AbortController();
    setLoadError(null);
    void adminClient.passkeys(controller.signal).then(data => {
      if (!controller.signal.aborted) setSettings(data);
    }).catch(cause => {
      if (!controller.signal.aborted && !onSessionError(cause)) setLoadError(cause);
    });
    return () => controller.abort();
  }, [onSessionError, reload]);

  useEffect(() => () => operation.current?.abort(), []);

  async function perform(kind: 'add' | 'remove', action: (signal: AbortSignal) => Promise<void>) {
    if (operation.current) return;
    const controller = new AbortController();
    operation.current = controller;
    setWorking(kind);
    setError(null);
    setNotice(null);
    try {
      await action(controller.signal);
    } catch (cause) {
      if (!controller.signal.aborted && !onSessionError(cause)) {
        if (cause instanceof AdminApiError && cause.code === 'passkey_password_required') {
          setSettings(current => current && { ...current, canManage: false });
          setConfirmId(null);
        }
        setError(cause);
      }
    } finally {
      operation.current = null;
      if (!controller.signal.aborted) setWorking(null);
    }
  }

  function add(event: React.FormEvent) {
    event.preventDefault();
    if (!settings?.canManage || settings.items.length >= PASSKEY_LIMIT || device !== 'ready') return;
    setConfirmId(null);
    void perform('add', async signal => {
      const item = await enrollPasskey(label.trim() || (ar ? 'جهازي' : 'My device'), signal);
      if (signal.aborted) return;
      setSettings(current => current && { ...current, items: [item, ...current.items] });
      setLabel('');
      setNotice('added');
    });
  }

  function remove(item: PasskeySummary) {
    if (!settings?.canManage || confirmId !== item.id) return;
    void perform('remove', async signal => {
      await adminClient.removePasskey(item.id, signal);
      if (signal.aborted) return;
      setSettings(current => current && { ...current, items: current.items.filter(key => key.id !== item.id) });
      setConfirmId(null);
      setNotice('removed');
    });
  }

  if (loadError != null) return (
    <section className="ad-panel ad-stack">
      <AdminMessage>{adminError(loadError, language)}</AdminMessage>
      <button type="button" className="ad-button ad-button-muted ad-passkey-retry" onClick={() => setReload(value => value + 1)}><RotateCw size={16} aria-hidden="true" />{ar ? 'إعادة التحميل' : 'Try again'}</button>
    </section>
  );
  if (!settings) return <section className="ad-panel"><AdminLoading language={language} /></section>;

  return (
    <div className="ad-stack">
      {error != null && <AdminMessage>{adminError(error, language)}</AdminMessage>}
      {notice && <AdminMessage error={false}>{notice === 'added'
        ? (ar ? 'تم تسجيل مفتاح المرور. يمكنك استخدامه عند تسجيل الدخول مرة أخرى.' : 'Passkey added. You can use it the next time you sign in.')
        : (ar ? 'تم إلغاء مفتاح المرور وإنهاء جلساته المفتوحة.' : 'Passkey revoked and its open sessions ended.')}</AdminMessage>}
      <div className="ad-detail-grid">
        <section className="ad-panel" aria-labelledby="ad-passkey-enroll">
          <div className="ad-panel-heading">
            <div>
              <h2 id="ad-passkey-enroll"><Fingerprint size={19} aria-hidden="true" />{ar ? 'الدخول بالبصمة أو الوجه' : 'Fingerprint or Face ID'}</h2>
              <p>{ar ? 'يستخدم مفتاح المرور طريقة التحقق المتوفرة على جهازك. لا يتلقّى الموقع بصمتك أو بيانات وجهك.' : 'A passkey uses your device’s security check. Your fingerprint and face data never reach the site.'}</p>
            </div>
          </div>
          <p className="ad-passkey-tip">{ar ? 'تظل كلمة المرور متاحة للدخول، حتى لو غيّرت جهازك.' : 'Your password remains available, even if you change devices.'}</p>
          {!settings.enabled ? <p className="ad-passkey-tip">{ar ? 'مفاتيح المرور غير مهيّأة على هذا العنوان. افتح عنوان HTTPS المعتمد للبوابة.' : 'Passkeys are not configured here. Open the portal at its configured HTTPS address.'}</p>
            : !settings.canManage ? <p className="ad-passkey-tip">{ar ? 'للإضافة أو الإلغاء، سجّل الخروج وادخل بكلمة المرور. يمكنك إدارة المفاتيح لمدة 10 دقائق بعد الدخول بها.' : 'To add or revoke a key, sign out and sign in with your password. You can manage keys for 10 minutes after using it.'}</p>
            : device === 'embedded' ? <PasskeyNewTab language={language} />
            : device !== 'ready' ? <p className="ad-passkey-tip">{ar ? 'استخدم متصفحًا يدعم مفاتيح المرور لتسجيل جهازك.' : 'Use a browser that supports passkeys to register your device.'}</p>
            : settings.items.length >= PASSKEY_LIMIT ? <p className="ad-passkey-tip">{ar ? 'احذف مفتاحًا قبل إضافة آخر.' : 'Remove a passkey before adding another.'}</p>
            : (
              <form className="ad-form-stack ad-passkey-form" onSubmit={add}>
                <label htmlFor="ad-passkey-label">{ar ? 'اسم الجهاز (اختياري)' : 'Device name (optional)'}
                  <input id="ad-passkey-label" className="ad-input" dir="auto" type="text" autoComplete="off" maxLength={PASSKEY_LABEL_LIMIT}
                    placeholder={ar ? 'مثال: هاتفي' : 'e.g. My phone'} value={label} onChange={event => setLabel(event.target.value)} disabled={working !== null} />
                </label>
                <button type="submit" className="ad-button ad-primary" disabled={working !== null}>
                  {working === 'add' ? <LoaderCircle size={17} className="ad-spin" aria-hidden="true" /> : <Plus size={17} aria-hidden="true" />}
                  {working === 'add' ? (ar ? 'أكمل التحقق على جهازك…' : 'Verify on your device…') : (ar ? 'إضافة مفتاح مرور' : 'Add a passkey')}
                </button>
              </form>
            )}
        </section>
        <section className="ad-panel" aria-labelledby="ad-passkey-list">
          <div className="ad-panel-heading">
            <div>
              <h2 id="ad-passkey-list"><KeyRound size={18} aria-hidden="true" />{ar ? 'المفاتيح المسجّلة' : 'Registered passkeys'}</h2>
              <p>{ar ? 'ألغِ مفتاح أي جهاز لم تعد تستخدمه.' : 'Revoke the key for a device you no longer use.'}</p>
            </div>
            <span className="ad-neutral-tag" dir="ltr">{numberText(settings.items.length, language)} / {PASSKEY_LIMIT}</span>
          </div>
          {settings.items.length === 0 ? <div className="ad-empty"><strong>{ar ? 'لا توجد مفاتيح مرور مسجّلة' : 'No passkeys registered'}</strong></div> : (
            <ul className="ad-passkey-list">
              {settings.items.map(item => (
                <li key={item.id}>
                  <div className="ad-passkey-row">
                    <div className="ad-passkey-item">
                      <strong><bdi>{item.label}</bdi></strong>
                      <small>{ar ? 'أُضيف في' : 'Added'} <time dateTime={item.createdAt}>{shortDate(item.createdAt, language)}</time></small>
                      <small>{item.lastUsedAt ? <>{ar ? 'آخر استخدام:' : 'Last used:'} <time dateTime={item.lastUsedAt}>{shortDate(item.lastUsedAt, language)}</time></> : (ar ? 'لم يُستخدم بعد' : 'Not used yet')}</small>
                    </div>
                    {settings.canManage && confirmId !== item.id && (
                      <button type="button" className="ad-button ad-button-muted" disabled={working !== null}
                        aria-label={`${ar ? 'إلغاء مفتاح المرور:' : 'Revoke passkey:'} ${item.label}`}
                        onClick={() => { setConfirmId(item.id); setNotice(null); setError(null); }}><Trash2 size={15} aria-hidden="true" />{ar ? 'إلغاء المفتاح' : 'Revoke'}</button>
                    )}
                  </div>
                  {settings.canManage && confirmId === item.id && (
                    <div className="ad-passkey-confirm">
                      <p>{ar ? 'سيُمنع الدخول بهذا المفتاح وتُنهى جلساته المفتوحة. سيظل المفتاح محفوظًا على جهازك حتى تزيله منه.' : 'This key can no longer sign in, and its open sessions will end. It stays on your device until you remove it there.'}</p>
                      <div>
                        <button type="button" className="ad-button ad-passkey-danger" disabled={working !== null} onClick={() => remove(item)}>{working === 'remove' ? (ar ? 'جارٍ الإلغاء…' : 'Revoking…') : (ar ? 'تأكيد الإلغاء' : 'Confirm revocation')}</button>
                        <button type="button" className="ad-button ad-button-muted" disabled={working !== null} onClick={() => setConfirmId(null)}>{ar ? 'رجوع' : 'Cancel'}</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
