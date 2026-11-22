/**
 * Uploading a member's photo and banner to Firebase Storage.
 *
 * The bucket path mirrors `storage.rules` exactly:
 *
 *   community_profiles/{uid}/{photo|banner}-{timestamp}.{jpg|png|webp}
 *
 * A member can only write under their own uid, only image bytes, and only within the
 * size the rule allows. The validation here is the same two checks, so a rejected
 * file never leaves the device.
 *
 * When Storage is not provisioned (or the build has no bucket), the caller gets a
 * typed `MediaUploadError` with `code: 'unavailable'` and the interface offers the
 * paste-a-link route instead of pretending the upload worked.
 */
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import type { User } from 'firebase/auth';
import { app, firebaseConfig, isFirebaseConfigured } from '../firebase/config';
import {
  extensionForMime,
  mediaPath,
  validateMediaFile,
  type NetworkMediaKind,
} from '../network/networkIdentity';

export type MediaErrorCode = 'unavailable' | 'invalid' | 'denied' | 'network';

export class MediaUploadError extends Error {
  readonly code: MediaErrorCode;
  readonly ar: string;
  readonly en: string;

  constructor(code: MediaErrorCode, ar: string, en: string) {
    super(`${code}: ${en}`);
    this.name = 'MediaUploadError';
    this.code = code;
    this.ar = ar;
    this.en = en;
  }
}

/** True only when a bucket is configured; the rule may still refuse the write. */
export function isMediaUploadAvailable(): boolean {
  return Boolean(isFirebaseConfigured && app && firebaseConfig?.storageBucket);
}

export async function uploadProfileImage(
  user: User,
  kind: NetworkMediaKind,
  file: File
): Promise<string> {
  if (!isMediaUploadAvailable()) {
    throw new MediaUploadError(
      'unavailable',
      'تخزين الصور غير مهيّأ في هذه النسخة. استخدم «لصق رابط» أو ولّد بانراً بعد تفعيل التخزين.',
      'Image storage is not provisioned in this build. Use “paste a link”, or generate a banner once storage is enabled.'
    );
  }

  const rejection = validateMediaFile(file, kind);
  if (rejection) throw new MediaUploadError('invalid', rejection.ar, rejection.en);

  const storage = getStorage(app!);
  const path = mediaPath(user.uid, kind, extensionForMime(file.type));
  const objectRef = ref(storage, path);

  try {
    await uploadBytes(
      objectRef,
      file,
      { contentType: file.type, cacheControl: 'public, max-age=86400' }
    );
    return await getDownloadURL(objectRef);
  } catch (error) {
    const code = (error as { code?: unknown } | null)?.code;
    const normalized = typeof code === 'string' ? code : '';
    if (normalized.includes('unauthorized') || normalized.includes('permission')) {
      throw new MediaUploadError(
        'denied',
        'رفض التخزين هذا الملف. تأكد أنك مسجّل الدخول وأن الصورة بصيغة وحجم مسموحين.',
        'Storage refused this file. Check that you are signed in and that the image type and size are allowed.'
      );
    }
    throw new MediaUploadError(
      'network',
      'تعذّر رفع الصورة. تحقّق من اتصالك ثم أعد المحاولة.',
      'The upload failed. Check your connection and try again.'
    );
  }
}
