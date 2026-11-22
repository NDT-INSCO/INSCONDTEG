/**
 * RFQ submission.
 *
 * The form used to answer "تم استلام طلبكم بنجاح" after generating a reference
 * number in the browser — nothing left the tab. That is the worst possible
 * failure for a sales form: the customer believes a quote request is queued,
 * and nobody at INSCO ever sees it.
 *
 * Rules encoded here:
 *   · A success screen may only be shown after a 2xx response that carries a
 *     reference issued by the server. No local reference is ever invented.
 *   · If no endpoint is configured (static GitHub Pages build without a
 *     gateway), the outcome is `not_configured` — the UI then offers mail and
 *     WhatsApp hand-off so the request still reaches a human.
 *   · Network/timeout/server errors are distinct and retryable.
 */

import { isStaticPages } from '../utils/staticPages';
import { normalizeRfqPhone } from './validation';

export interface RfqFormData {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  serviceType: string;
  projectLocation: string;
  description: string;
}

export interface RfqPayload extends RfqFormData {
  language: 'ar' | 'en';
  pageUrl?: string;
  submittedAt: string;
  /** Honeypot: humans never fill this; the gateway drops answers that do. */
  website?: string;
}

export type RfqFailureReason = 'not_configured' | 'validation' | 'network' | 'rate_limited' | 'server';

export type RfqOutcome =
  | { status: 'sent'; reference: string }
  | { status: 'failed'; reason: RfqFailureReason; detail?: string };

const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Where to POST.
 *
 * `VITE_RFQ_ENDPOINT` may be either the full endpoint (a Google Apps Script
 * `/exec` URL) or the base of the INSCO gateway, in which
 * case `/api/rfq` is appended — the same convention `VITE_AI_BASE_URL` uses for
 * `/api/ai/*`.
 */
export function resolveRfqEndpoint(override?: string | null, staticOnly = isStaticPages()): string | null {
  if (override === null) return null;
  const configured = (override ?? import.meta.env?.VITE_RFQ_ENDPOINT ?? '').trim();
  if (!configured) return staticOnly ? null : '/api/rfq';
  if (configured === '/api/rfq') return staticOnly ? null : configured;
  // Customer data must not be posted to an insecure or credential-bearing URL.
  try {
    const target = new URL(configured);
    if (target.protocol !== 'https:' || target.username || target.password || target.hash) return null;
    if (!/\/exec$|\/formResponse$|\/api\/rfq\/?$/i.test(target.pathname)) {
      target.pathname = `${target.pathname.replace(/\/+$/, '')}/api/rfq`;
    }
    return target.href;
  } catch {
    return null;
  }
}

export function buildRfqPayload(
  form: RfqFormData,
  language: 'ar' | 'en',
  extra: { pageUrl?: string; now?: Date } = {},
): RfqPayload {
  return {
    ...form,
    companyName: form.companyName.trim(),
    contactName: form.contactName.trim(),
    email: form.email.trim(),
    phone: normalizeRfqPhone(form.phone) ?? form.phone.trim(),
    projectLocation: form.projectLocation.trim(),
    description: form.description.trim(),
    language,
    pageUrl: extra.pageUrl,
    submittedAt: (extra.now ?? new Date()).toISOString(),
  };
}

interface SubmitOptions {
  endpoint?: string | null;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

/** POST the request and report what actually happened. */
export async function submitRfq(payload: RfqPayload, options: SubmitOptions = {}): Promise<RfqOutcome> {
  const resolved = resolveRfqEndpoint(options.endpoint);
  if (!resolved) return { status: 'failed', reason: 'not_configured' };
  const endpoint =
    resolved.startsWith('/') && typeof window !== 'undefined' && window.location?.origin
      ? `${window.location.origin}${resolved}`
      : resolved;

  const doFetch = options.fetchImpl ?? (typeof fetch === 'function' ? fetch : null);
  if (!doFetch) return { status: 'failed', reason: 'network', detail: 'fetch unavailable' };

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS)
    : null;

  // Google Apps Script web apps do not answer the CORS preflight that a JSON
  // content type triggers, so the request never leaves the browser. The body is
  // still JSON; only the declared type changes.
  const isAppsScript = /script\.google\.com|googleusercontent\.com/.test(endpoint);
  const contentType = isAppsScript ? 'text/plain;charset=utf-8' : 'application/json';

  let response: Response;
  let body: unknown = null;
  try {
    response = await doFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': contentType, Accept: 'application/json' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
      body: JSON.stringify(payload),
      signal: controller?.signal,
    });
    // A static host may still return 404 for a configured but missing endpoint.
    if ([404, 405, 501].includes(response.status)) return { status: 'failed', reason: 'not_configured' };
    body = await response.json().catch(() => null);
  } catch {
    return { status: 'failed', reason: 'network' };
  } finally {
    if (timer) clearTimeout(timer);
  }

  const record = (body ?? {}) as { ok?: unknown; reference?: unknown; error?: unknown };
  if (response.status === 429) return { status: 'failed', reason: 'rate_limited' };
  if (record.error === 'rfq_delivery_not_configured') return { status: 'failed', reason: 'not_configured' };
  if (response.status === 400 || response.status === 422) return { status: 'failed', reason: 'validation' };

  const reference = typeof record.reference === 'string' ? record.reference.trim() : '';
  if (!response.ok || record.ok !== true || !/^[a-z0-9][a-z0-9._-]{2,79}$/i.test(reference)) {
    return { status: 'failed', reason: 'server' };
  }

  return { status: 'sent', reference };
}

const SERVICE_LABELS: Record<string, { ar: string; en: string }> = {
  pwht: { ar: 'معالجة حرارية بعد اللحام (PWHT)', en: 'Post-Weld Heat Treatment (PWHT)' },
  ut_paut: { ar: 'فحص UT / PAUT', en: 'Ultrasonic UT / PAUT' },
  rt_gamma: { ar: 'تصوير إشعاعي جاما / إكس راي (RT)', en: 'Radiography (RT)' },
  mt_pt: { ar: 'فحوصات سطحية MT / PT / VT', en: 'Surface MT/PT/VT' },
  pmi_hardness: { ar: 'تحليل سبائك وصلادة PMI / HT', en: 'PMI & Hardness' },
  hydro: { ar: 'اختبار هيدروستاتيكي', en: 'Hydrostatic Testing' },
  manpower: { ar: 'توريد عمالة معتمدة', en: 'Certified Manpower' },
  prequal: { ar: 'تسجيل في سجل الموردين (AVL)', en: 'AVL Registration' },
};

export function serviceLabel(serviceType: string, language: 'ar' | 'en'): string {
  return SERVICE_LABELS[serviceType]?.[language] ?? serviceType;
}

/** Human-readable body used for the mail/WhatsApp hand-off. */
export function buildRfqMessage(form: RfqFormData, language: 'ar' | 'en'): string {
  const lines =
    language === 'ar'
      ? [
          'طلب عرض سعر — شركة إنسكو',
          `الشركة: ${form.companyName}`,
          `المسؤول: ${form.contactName || '—'}`,
          `الهاتف: ${form.phone}`,
          `البريد: ${form.email}`,
          `الخدمة: ${serviceLabel(form.serviceType, 'ar')}`,
          `الموقع: ${form.projectLocation || '—'}`,
          `التفاصيل: ${form.description || '—'}`,
        ]
      : [
          'RFQ — INSCO',
          `Company: ${form.companyName}`,
          `Contact: ${form.contactName || '—'}`,
          `Phone: ${form.phone}`,
          `Email: ${form.email}`,
          `Service: ${serviceLabel(form.serviceType, 'en')}`,
          `Location: ${form.projectLocation || '—'}`,
          `Scope: ${form.description || '—'}`,
        ];
  return lines.join('\n');
}
