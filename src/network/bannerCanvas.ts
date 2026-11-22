/**
 * The generated banner, drawn on a canvas in the browser.
 *
 * A member who has no banner image can still have a professional one: the card's own
 * name, headline, organisation and sector, laid out with a palette chosen by sector.
 * Nothing is added to the picture that the member did not type — no certificates, no
 * badges, no "verified" mark.
 *
 * `drawBanner` is separated from `renderBannerBlob` so the drawing can be exercised
 * against a stub context in tests, where jsdom has no canvas.
 */
import type { BannerSpec } from './networkIdentity';

const FONT_STACK = '"Tajawal", "Segoe UI", "Noto Kufi Arabic", system-ui, sans-serif';

export function drawBanner(ctx: CanvasRenderingContext2D, spec: BannerSpec): void {
  const { width, height, palette, rtl } = spec;
  const padding = Math.round(width * 0.05);

  /* --------------------------- background gradient -------------------------- */
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, palette.from);
  gradient.addColorStop(1, palette.to);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  /* ------------------------- faint engineering grid ------------------------- */
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 1;
  const step = Math.round(width / 24);
  for (let x = 0; x < width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + height, height);
    ctx.stroke();
  }
  ctx.restore();

  /* ------------------------------ accent sweep ------------------------------ */
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = palette.accent;
  const sweepX = rtl ? 0 : width - Math.round(width * 0.18);
  ctx.fillRect(sweepX, 0, Math.round(width * 0.18), Math.round(height * 0.045));
  ctx.restore();

  /* -------------------------------- initials -------------------------------- */
  const avatarRadius = Math.round(height * 0.19);
  const avatarX = rtl ? width - padding - avatarRadius : padding + avatarRadius;
  const avatarY = Math.round(height * 0.42);
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.10)';
  ctx.fill();
  ctx.lineWidth = Math.max(3, Math.round(height * 0.012));
  ctx.strokeStyle = palette.accent;
  ctx.stroke();
  ctx.fillStyle = palette.ink;
  ctx.font = `700 ${Math.round(avatarRadius * 0.78)}px ${FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.direction = rtl ? 'rtl' : 'ltr';
  ctx.fillText(spec.initials, avatarX, avatarY + Math.round(avatarRadius * 0.04));
  ctx.restore();

  /* ---------------------------------- text ---------------------------------- */
  const textEdge = rtl
    ? avatarX - avatarRadius - Math.round(width * 0.035)
    : avatarX + avatarRadius + Math.round(width * 0.035);
  ctx.save();
  ctx.direction = rtl ? 'rtl' : 'ltr';
  ctx.textAlign = rtl ? 'right' : 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = palette.ink;

  const nameSize = Math.round(height * 0.145);
  const nameY = spec.headlineLines.length > 0 ? Math.round(height * 0.40) : Math.round(height * 0.52);
  ctx.font = `700 ${nameSize}px ${FONT_STACK}`;
  ctx.fillText(truncate(ctx, spec.name, width - padding * 2 - avatarRadius * 2), textEdge, nameY);

  let cursor = nameY + Math.round(height * 0.10);
  if (spec.headlineLines.length > 0) {
    ctx.font = `500 ${Math.round(height * 0.062)}px ${FONT_STACK}`;
    ctx.globalAlpha = 0.92;
    for (const line of spec.headlineLines) {
      ctx.fillText(line, textEdge, cursor);
      cursor += Math.round(height * 0.075);
    }
  }

  if (spec.metaLine !== '') {
    ctx.globalAlpha = 0.8;
    ctx.font = `400 ${Math.round(height * 0.052)}px ${FONT_STACK}`;
    ctx.fillStyle = palette.accent;
    ctx.fillText(truncate(ctx, spec.metaLine, width - padding * 2), textEdge, Math.min(cursor, Math.round(height * 0.86)));
  }

  /* --------------------------------- brand ---------------------------------- */
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = palette.ink;
  ctx.font = `600 ${Math.round(height * 0.045)}px ${FONT_STACK}`;
  ctx.textAlign = rtl ? 'left' : 'right';
  ctx.fillText(spec.brand, rtl ? padding : width - padding, height - Math.round(height * 0.07));
  ctx.restore();
}

/** Canvas has no wrapping for a single line; shorten with an ellipsis instead of clipping. */
function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (text === '') return text;
  if (ctx.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && ctx.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result.trim()}…`;
}

/**
 * Draw the banner and hand back a JPEG.
 *
 * Returns `null` when the environment cannot draw (no `document`, no 2D context, or
 * no `toBlob`) — the caller then explains that banner generation needs a browser
 * instead of uploading a blank image.
 */
export async function renderBannerBlob(spec: BannerSpec): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  drawBanner(ctx, spec);
  if (typeof canvas.toBlob !== 'function') return null;
  return await new Promise<Blob | null>(resolve => {
    canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.92);
  });
}
