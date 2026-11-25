import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CircleAlert, ImagePlus, Loader2, Linkedin, Sparkles, Trash2, Upload } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { Language } from '../../types';
import {
  NETWORK_MEDIA_LIMITS,
  NETWORK_PROFILE_VISIBILITY,
  bannerSpecFor,
  canGenerateBanner,
  initialsOf,
  type NetworkMediaKind,
} from '../../network/networkIdentity';
import type { NetworkProfileDraft } from '../../network/networkProfileForm';
import { renderBannerBlob } from '../../network/bannerCanvas';
import { useTheme } from '../../utils/themeStore';
import { networkSurface } from './networkTheme';

interface NetworkIdentityFieldsProps {
  language: Language;
  draft: NetworkProfileDraft;
  user: User | null;
  uploadEnabled: boolean;
  errors: Map<string, string>;
  onChange: <K extends keyof NetworkProfileDraft>(key: K, value: NetworkProfileDraft[K]) => void;
}

type Status = { tone: 'ok' | 'error' | 'busy'; text: string } | null;

/**
 * Photo, banner, LinkedIn and audience — the parts of the card that build the
 * Facebook-style public engineering page.
 */
export const NetworkIdentityFields: React.FC<NetworkIdentityFieldsProps> = ({
  language,
  draft,
  user,
  uploadEnabled,
  errors,
  onChange,
}) => {
  const isAr = language === 'ar';
  const { isLight } = useTheme();
  const s = networkSurface(isLight);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState<NetworkMediaKind | 'generate' | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);

  useEffect(
    () => () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    },
    [downloadUrl]
  );

  const upload = useCallback(
    async (kind: NetworkMediaKind, file: File) => {
      if (!user) {
        setStatus({ tone: 'error', text: isAr ? 'سجّل الدخول أولاً.' : 'Sign in first.' });
        return;
      }
      setBusy(kind);
      setStatus({ tone: 'busy', text: isAr ? 'جارٍ الرفع…' : 'Uploading…' });
      try {
        const api = await import('../../client/profileMediaService');
        const url = await api.uploadProfileImage(user, kind, file);
        onChange(kind === 'photo' ? 'photoURL' : 'bannerURL', url);
        setStatus({
          tone: 'ok',
          text: isAr ? 'تم الرفع — احفظ البطاقة لتثبيت الصورة.' : 'Uploaded — save the card to keep it.',
        });
      } catch (error) {
        const api = await import('../../client/profileMediaService');
        const message =
          error instanceof api.MediaUploadError ? (isAr ? error.ar : error.en) : isAr ? 'تعذّر الرفع.' : 'Upload failed.';
        setStatus({ tone: 'error', text: message });
      } finally {
        setBusy(null);
      }
    },
    [isAr, onChange, user]
  );

  const generate = useCallback(async () => {
    if (!canGenerateBanner(draft)) {
      setStatus({ tone: 'error', text: isAr ? 'اكتب اسمك أولاً ليُبنى البانر عليه.' : 'Enter your name first; the banner is built from it.' });
      return;
    }
    setBusy('generate');
    setStatus({ tone: 'busy', text: isAr ? 'جارٍ توليد البانر…' : 'Generating the banner…' });
    try {
      const blob = await renderBannerBlob(bannerSpecFor(draft, isAr ? 'ar' : 'en'));
      if (!blob) {
        setStatus({
          tone: 'error',
          text: isAr
            ? 'هذا المتصفح لا يدعم رسم الصور. ارفع بانراً جاهزاً بدلاً منه.'
            : 'This browser cannot draw images. Upload a ready banner instead.',
        });
        return;
      }
      if (uploadEnabled && user) {
        const api = await import('../../client/profileMediaService');
        const file = new File([blob], 'banner.jpg', { type: 'image/jpeg' });
        const url = await api.uploadProfileImage(user, 'banner', file);
        onChange('bannerURL', url);
        setStatus({ tone: 'ok', text: isAr ? 'وُلِّد البانر ورُفع. احفظ البطاقة.' : 'Banner generated and uploaded. Save the card.' });
      } else {
        const objectUrl = URL.createObjectURL(blob);
        setDownloadUrl(objectUrl);
        setStatus({
          tone: 'ok',
          text: isAr
            ? 'تخزين الصور غير مهيّأ، لذلك ولّدنا البانر للتنزيل. انشره أو ارفعه بعد تفعيل التخزين.'
            : 'Image storage is not provisioned, so the banner was generated for download. Publish or upload it once storage is enabled.',
        });
      }
    } catch (error) {
      const api = await import('../../client/profileMediaService');
      const message =
        error instanceof api.MediaUploadError ? (isAr ? error.ar : error.en) : isAr ? 'تعذّر التوليد.' : 'Generation failed.';
      setStatus({ tone: 'error', text: message });
    } finally {
      setBusy(null);
    }
  }, [draft, isAr, onChange, uploadEnabled, user]);

  const remove = (kind: NetworkMediaKind) => {
    onChange(kind === 'photo' ? 'photoURL' : 'bannerURL', '');
    setStatus({ tone: 'ok', text: isAr ? 'أُزيلت الصورة من البطاقة — احفظ لتثبيت ذلك.' : 'Removed from the card — save to keep it.' });
  };

  const pickFile = (kind: NetworkMediaKind) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) void upload(kind, file);
  };

  return (
    <section id="np-identity-section" data-testid="network-identity-fields" className={`min-w-0 ${s.subCard} p-3`}>
      <h4 className={`flex items-center gap-1.5 text-[11px] font-bold ${s.heading}`}>
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
        {isAr ? 'هويتك على صفحتك العامة (البانر والصورة)' : 'Your public-page identity (Banner & Photo)'}
      </h4>

      {/* ------------------------------- banner ------------------------------- */}
      <div className="mt-2">
        <span className={`block text-[10px] font-bold ${s.subtext}`}>{isAr ? 'البانر (صورة الغلاف)' : 'Banner (Cover Photo)'}</span>
        <div
          className={`relative mt-1 overflow-hidden rounded-lg border ${s.divider}`}
          style={{ aspectRatio: `${NETWORK_MEDIA_LIMITS.bannerWidth} / ${NETWORK_MEDIA_LIMITS.bannerHeight}` }}
        >
          {draft.bannerURL ? (
            <img
              src={draft.bannerURL}
              alt={isAr ? 'بانر الملف' : 'Profile banner'}
              data-testid="network-identity-banner"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#120b2e] via-[#241a4d] to-[#3b1d7a]">
              <span className="flex items-center gap-2 text-[10px] text-violet-200/85">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-violet-400/60 text-[10px] font-bold text-violet-100">
                  {initialsOf(draft.displayName)}
                </span>
                {isAr ? 'لا بانر بعد — ولّد واحداً أو ارفع صورة' : 'No banner yet — generate one or upload an image'}
              </span>
            </div>
          )}
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => bannerInput.current?.click()}
            disabled={busy !== null}
            className={`${s.buttonSecondary} disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {busy === 'banner' ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" /> : <Upload className="h-3 w-3 shrink-0" aria-hidden="true" />}
            {isAr ? 'رفع بانر' : 'Upload a banner'}
          </button>
          <button
            type="button"
            onClick={() => void generate()}
            disabled={busy !== null}
            data-testid="network-generate-banner"
            className="inline-flex items-center gap-1 rounded-lg border border-violet-400/50 bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold text-violet-400 transition cursor-pointer hover:border-violet-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy === 'generate' ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" /> : <Sparkles className="h-3 w-3 shrink-0" aria-hidden="true" />}
            {isAr ? 'توليد بانر احترافي' : 'Generate a banner'}
          </button>
          {draft.bannerURL ? (
            <button
              type="button"
              onClick={() => remove('banner')}
              className={s.buttonSecondary}
            >
              <Trash2 className="h-3 w-3 shrink-0" aria-hidden="true" />
              {isAr ? 'إزالة' : 'Remove'}
            </button>
          ) : null}
          {downloadUrl ? (
            <a
              href={downloadUrl}
              download="insco-banner.jpg"
              data-testid="network-banner-download"
              className="inline-flex items-center gap-1 rounded-md border border-emerald-400/50 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400"
            >
              {isAr ? 'تنزيل البانر' : 'Download the banner'}
            </a>
          ) : null}
        </div>
        <input
          ref={bannerInput}
          type="file"
          accept={NETWORK_MEDIA_LIMITS.acceptedTypes.join(',')}
          onChange={pickFile('banner')}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
        {errors.get('bannerURL') ? (
          <p role="alert" className="mt-1 text-[10px] text-rose-400">{errors.get('bannerURL')}</p>
        ) : null}
      </div>

      {/* -------------------------- photo + LinkedIn -------------------------- */}
      <div className="mt-2.5 grid min-w-0 gap-2 sm:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex items-end gap-2">
          <div className="relative">
            {draft.photoURL ? (
              <img
                src={draft.photoURL}
                alt={isAr ? 'صورتك الشخصية' : 'Your photo'}
                data-testid="network-identity-photo"
                className="h-14 w-14 shrink-0 rounded-full border-2 border-violet-400/60 object-cover"
                loading="lazy"
              />
            ) : (
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-violet-500/40 text-[13px] font-bold ${s.muted}`}>
                {initialsOf(draft.displayName)}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => photoInput.current?.click()}
              disabled={busy !== null}
              className={`${s.buttonSecondary} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {busy === 'photo' ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-3 w-3 shrink-0" aria-hidden="true" />}
              {isAr ? 'صورة شخصية' : 'Profile photo'}
            </button>
            {draft.photoURL ? (
              <button
                type="button"
                onClick={() => remove('photo')}
                className={s.buttonSecondary}
              >
                <Trash2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                {isAr ? 'إزالة' : 'Remove'}
              </button>
            ) : null}
          </div>
          <input
            ref={photoInput}
            type="file"
            accept={NETWORK_MEDIA_LIMITS.acceptedTypes.join(',')}
            onChange={pickFile('photo')}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>

        <label className="min-w-0">
          <span className={`flex items-center gap-1 text-[10px] font-bold ${s.subtext}`}>
            <Linkedin className="h-3 w-3 shrink-0 text-sky-400" aria-hidden="true" />
            {isAr ? 'رابط LinkedIn (اختياري)' : 'LinkedIn URL (optional)'}
          </span>
          <input
            value={draft.linkedInUrl}
            onChange={event => onChange('linkedInUrl', event.target.value)}
            maxLength={NETWORK_MEDIA_LIMITS.urlMax}
            dir="ltr"
            className={`${s.input} mt-0.5`}
            placeholder="https://www.linkedin.com/in/your-name"
            aria-label={isAr ? 'رابط LinkedIn' : 'LinkedIn URL'}
          />
          {errors.get('linkedInUrl') ? (
            <p role="alert" className="mt-0.5 text-[10px] text-rose-400">{errors.get('linkedInUrl')}</p>
          ) : (
            <p className={`mt-0.5 text-[9px] ${s.muted}`}>
              {isAr ? 'يظهر كزر على صفحتك العامة — نقبل linkedin.com فقط.' : 'Shown as a button on your page — LinkedIn hosts only.'}
            </p>
          )}
        </label>
      </div>

      {/* -------------------------- paste-a-link route ------------------------- */}
      <details className={`mt-2 ${s.subCard} px-2 py-1.5`}>
        <summary className={`cursor-pointer text-[10px] font-bold ${s.subtext}`}>
          {isAr ? 'أو الصق رابط صورة جاهز' : 'Or paste an image link'}
        </summary>
        <div className="mt-1.5 grid min-w-0 gap-1.5">
          <input
            value={draft.photoURL}
            onChange={event => onChange('photoURL', event.target.value)}
            dir="ltr"
            className={s.input}
            placeholder="https://…/photo.jpg"
            aria-label={isAr ? 'رابط الصورة الشخصية' : 'Photo URL'}
          />
          <input
            value={draft.bannerURL}
            onChange={event => onChange('bannerURL', event.target.value)}
            dir="ltr"
            className={s.input}
            placeholder="https://…/banner.jpg"
            aria-label={isAr ? 'رابط البانر' : 'Banner URL'}
          />
          <p className={`text-[9px] leading-relaxed ${s.muted}`}>
            {isAr
              ? `روابط https فقط، وألا تتجاوز ${NETWORK_MEDIA_LIMITS.urlMax} حرفاً — القواعد ترفض غير ذلك.`
              : `HTTPS links only, at most ${NETWORK_MEDIA_LIMITS.urlMax} characters — the rules reject anything else.`}
          </p>
        </div>
      </details>

      {/* ------------------------------- audience ------------------------------ */}
      <fieldset className="mt-2.5">
        <legend className={`text-[10px] font-bold ${s.subtext}`}>{isAr ? 'من يرى صفحتك العامة؟' : 'Who can open your page?'}</legend>
        <div className="mt-1 grid min-w-0 gap-1 sm:grid-cols-2">
          {NETWORK_PROFILE_VISIBILITY.map(option => {
            const checked = draft.profileVisibility === option.id;
            return (
              <label
                key={option.id}
                className={`flex min-w-0 cursor-pointer items-start gap-1.5 rounded-lg border p-1.5 text-[10px] leading-relaxed transition ${
                  checked
                    ? isLight
                      ? 'border-violet-500 bg-violet-50 text-slate-900'
                      : 'border-violet-400/60 bg-violet-500/10 text-slate-200'
                    : `${s.subCard} ${s.subtext} hover:border-violet-400/40`
                }`}
              >
                <input
                  type="radio"
                  name="np-visibility"
                  value={option.id}
                  checked={checked}
                  onChange={() => onChange('profileVisibility', option.id)}
                  className="mt-0.5 h-3 w-3 shrink-0 accent-violet-500"
                  data-testid={`network-visibility-${option.id}`}
                />
                <span className="min-w-0">
                  <span className="block font-bold">{isAr ? option.ar : option.en}</span>
                  <span className={`block text-[9px] ${s.muted}`}>{isAr ? option.hintAr : option.hintEn}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {!uploadEnabled ? (
        <p className="mt-2 flex items-start gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[9px] leading-relaxed text-amber-400">
          <CircleAlert className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          {isAr
            ? 'رفع الصور يحتاج تهيئة Firebase Storage — لم تُهيَّأ في هذه النسخة، لذلك الرفع معطّل بصراحة. التوليد والروابط تعمل.'
            : 'Image upload needs Firebase Storage, which is not provisioned in this build, so uploads are plainly disabled. Generation and links still work.'}
        </p>
      ) : null}

      {status ? (
        <p
          role={status.tone === 'error' ? 'alert' : 'status'}
          data-testid="network-identity-status"
          className={`mt-2 text-[10px] leading-relaxed ${
            status.tone === 'error' ? 'text-rose-400' : status.tone === 'ok' ? 'text-emerald-400' : s.muted
          }`}
        >
          {status.text}
        </p>
      ) : null}
    </section>
  );
};

export default NetworkIdentityFields;
