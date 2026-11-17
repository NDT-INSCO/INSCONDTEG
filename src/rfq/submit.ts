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

export type RfqFailureReason = 'not_configured' | 'validation' | 'network' | 'server';

export type RfqOutcome =
  | { status: 'sent'; reference: string }
  | { status: 'failed'; reason: RfqFailureReason; detail?: string };

const DEFAULT_TIMEOUT_MS = 15000;

function envValue(key: string): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return (env?.[key] ?? '').trim();
}

/**
 * Where to POST.
 *
 * `VITE_RFQ_ENDPOINT` may be either the full endpoint (a Google Apps Script
 * `/exec` URL, Formspree form URL…) or the base of the INSCO gateway, in which
 * case `/api/rfq` is appended — the same convention `VITE_AI_BASE_URL` uses for
 * `/api/ai/*`.
 */
export function resolveRfqEndpoint(override?: string | null): string | null {
  const configured = (override ?? envValue('VITE_RFQ_ENDPOINT')).trim();
  if (!configured) return '/api/rfq';
  if (/\/exec$|\/formResponse$|\/api\/rfq\/?$/i.test(configured)) return configured;
  return `${configured.replace(/\/+$/, '')}/api/rfq`;
}

export function buildRfqPayload(
  form: RfqFormData,
  language: 'ar' | 'en',
  extra: { pageUrl?: string; now?: Date } = {},
): RfqPayload {
  return {
    ...form,
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
  try {
    response = await doFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': contentType, Accept: 'application/json' },
      body: JSON.stringify(payload),
      signal: controller?.signal,
    });
  } catch (error) {
    return {
      status: 'failed',
      reason: 'network',
      detail: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (timer) clearTimeout(timer);
  }

  // Nothing is listening: a static host answers 404/405 for /api/rfq, and an
  // un-configured web app answers 501. That is not a customer error.
  if ([404, 405, 501].includes(response.status)) {
    return { status: 'failed', reason: 'not_configured', detail: `HTTP ${response.status}` };
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  const record = (body ?? {}) as { reference?: unknown; detail?: unknown; error?: unknown };

  if (response.status === 400 || response.status === 422) {
    return {
      status: 'failed',
      reason: 'validation',
      detail: typeof record.detail === 'string' ? record.detail : `HTTP ${response.status}`,
    };
  }

  if (!response.ok) {
    const detail =
      typeof record.detail === 'string'
        ? record.detail
        : typeof record.error === 'string'
          ? record.error
          : `HTTP ${response.status}`;
    return { status: 'failed', reason: 'server', detail };
  }

  const reference = typeof record.reference === 'string' ? record.reference.trim() : '';
  // A 2xx without a reference means the request was not registered anywhere we
  // can point the customer to; claim nothing.
  if (!reference) {
    return { status: 'failed', reason: 'server', detail: 'missing reference in response' };
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

export function buildRfqMailto(form: RfqFormData, inbox: string, language: 'ar' | 'en'): string {
  const subject = language === 'ar' ? `طلب عرض سعر — ${form.companyName}` : `RFQ — ${form.companyName}`;
  return `mailto:${inbox}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildRfqMessage(form, language))}`;
}

export function buildRfqWhatsApp(form: RfqFormData, whatsapp: string, language: 'ar' | 'en'): string {
  const digits = whatsapp.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(buildRfqMessage(form, language))}`;
}
