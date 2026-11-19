export interface FaceCaptureAnalysis {
  faceDetected: boolean;
  luminanceMean: number;
  contrastStd: number;
  digest: string;
  previewDataUrl?: string;
}

/**
 * Computes a deterministic compact hex digest from sample pixel/string bytes.
 * Never returns large payloads; safe for Firestore metadata fields (<= 64 chars).
 */
export function computeCompactFaceDigest(sample: Uint8Array | string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b9;
  const len = typeof sample === 'string' ? sample.length : sample.length;
  for (let i = 0; i < len; i += 1) {
    const byte = typeof sample === 'string' ? sample.charCodeAt(i) & 0xff : sample[i];
    h1 ^= byte;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= (byte + i) & 0xff;
    h2 = Math.imul(h2, 0x85ebca6b);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  return `FC-${part1}-${part2}`;
}

/**
 * Evaluates raw RGBA canvas pixels in the central frame to verify non-blank live subject contrast.
 */
export function analyzeRgbaFrame(
  data: Uint8ClampedArray,
  width: number,
  height: number
): Omit<FaceCaptureAnalysis, 'previewDataUrl'> {
  if (!data || data.length < 4 || width <= 0 || height <= 0) {
    return {
      faceDetected: false,
      luminanceMean: 0,
      contrastStd: 0,
      digest: computeCompactFaceDigest('EMPTY'),
    };
  }

  const startX = Math.floor(width * 0.25);
  const endX = Math.max(startX + 1, Math.floor(width * 0.75));
  const startY = Math.floor(height * 0.2);
  const endY = Math.max(startY + 1, Math.floor(height * 0.8));

  const samples: number[] = [];
  const digestBytes: number[] = [];
  let sum = 0;

  for (let y = startY; y < endY; y += 4) {
    for (let x = startX; x < endX; x += 4) {
      const idx = (y * width + x) * 4;
      const r = data[idx] ?? 0;
      const g = data[idx + 1] ?? 0;
      const b = data[idx + 2] ?? 0;
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      samples.push(lum);
      sum += lum;
      if (digestBytes.length < 256) {
        digestBytes.push(Math.round(lum));
      }
    }
  }

  if (samples.length === 0) {
    return {
      faceDetected: false,
      luminanceMean: 0,
      contrastStd: 0,
      digest: computeCompactFaceDigest('EMPTY'),
    };
  }

  const mean = sum / samples.length;
  let varianceSum = 0;
  for (const v of samples) {
    varianceSum += (v - mean) ** 2;
  }
  const std = Math.sqrt(varianceSum / samples.length);

  // Reject uniform black/white frames; accept real illuminated camera frames with facial contrast
  const faceDetected = mean >= 22 && mean <= 238 && std >= 8;

  return {
    faceDetected,
    luminanceMean: Math.round(mean),
    contrastStd: Math.round(std * 10) / 10,
    digest: computeCompactFaceDigest(new Uint8Array(digestBytes)),
  };
}

/**
 * Captures a single verification snapshot from an active HTMLVideoElement into an ephemeral canvas.
 * The data URL stays strictly in local UI state; only the compact digest + boolean are persisted.
 */
export function captureFaceFrameFromVideo(
  video: HTMLVideoElement
): FaceCaptureAnalysis {
  const width = video.videoWidth || 320;
  const height = video.videoHeight || 240;
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = Math.max(90, Math.round((160 * height) / Math.max(1, width)));
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      faceDetected: false,
      luminanceMean: 0,
      contrastStd: 0,
      digest: computeCompactFaceDigest('NO_CTX'),
    };
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const analysis = analyzeRgbaFrame(imageData.data, canvas.width, canvas.height);
  let previewDataUrl: string | undefined;
  try {
    previewDataUrl = canvas.toDataURL('image/jpeg', 0.65);
  } catch {
    previewDataUrl = undefined;
  }
  return {
    ...analysis,
    previewDataUrl,
  };
}
