/**
 * Server side of the RFQ form.
 *
 * Written as pure functions with injected delivery/clock so it can be tested
 * without Express and without sending mail. `server.ts` only wires it up.
 *
 * Contract: a 2xx with a reference means "stored and delivered". Anything else
 * is a failure the browser must show honestly. There is no path here that
 * answers success without a delivery acknowledgement.
 */

import { randomBytes } from 'node:crypto';

export interface RfqRecord {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  serviceType: string;
  projectLocation: string;
  description: string;
  language: 'ar' | 'en';
  pageUrl?: string;
  submittedAt: string;
  reference: string;
  receivedAt: string;
  remoteAddress?: string;
}

export type Delivery = (record: RfqRecord) => Promise<{ ok: true } | { ok: false; detail?: string }>;

export interface RfqHandlerOptions {
  deliver: Delivery | null;
  now?: () => Date;
  /** Sequential-ish suffix source; overridable in tests for stability. */
  randomSuffix?: () => string;
}

export interface RfqHttpResult {
  status: number;
  body: Record<string, unknown>;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const REQUIRED_FIELDS = ['companyName', 'phone', 'email'] as const;
const MAX_LENGTHS: Record<string, number> = {
  companyName: 160,
  contactName: 160,
  phone: 40,
  email: 160,
  serviceType: 60,
  projectLocation: 160,
  description: 4000,
};

export function makeReference(now: Date, suffix: string): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  return `INSCO-RFQ-${y}${m}${d}-${suffix}`;
}

export type RfqValidation =
  | { ok: true; value: Omit<RfqRecord, 'reference' | 'receivedAt' | 'remoteAddress'> }
  | { ok: false; problems: string[] };

/** Structural validation. Bots are rejected through the honeypot field. */
export function validateRfqBody(body: unknown): RfqValidation {
  if (!body || typeof body !== 'object') return { ok: false, problems: ['body must be a JSON object'] };
  const input = body as Record<string, unknown>;
  const problems: string[] = [];

  // Honeypot: a real visitor never fills a field that is hidden from them.
  if (typeof input.website === 'string' && input.website.trim() !== '') {
    return { ok: false, problems: ['honeypot'] };
  }

  const text = (key: string): string => (typeof input[key] === 'string' ? (input[key] as string).trim() : '');

  for (const field of REQUIRED_FIELDS) {
    if (!text(field)) problems.push(`${field} is required`);
  }
  if (text('email') && !EMAIL.test(text('email'))) problems.push('email is not a valid address');
  if (text('phone') && text('phone').replace(/\D/g, '').length < 8) problems.push('phone is too short');
  for (const [field, max] of Object.entries(MAX_LENGTHS)) {
    if (text(field).length > max) problems.push(`${field} exceeds ${max} characters`);
  }

  if (problems.length > 0) return { ok: false, problems };

  const language = text('language') === 'en' ? 'en' : 'ar';
  return {
    ok: true,
    value: {
      companyName: text('companyName'),
      contactName: text('contactName'),
      phone: text('phone'),
      email: text('email'),
      serviceType: text('serviceType') || 'general',
      projectLocation: text('projectLocation'),
      description: text('description'),
      language,
      pageUrl: typeof input.pageUrl === 'string' ? (input.pageUrl as string).slice(0, 500) : undefined,
      submittedAt: typeof input.submittedAt === 'string' ? input.submittedAt : new Date().toISOString(),
    },
  };
}

/** One handler for the whole request: validate → deliver → reference. */
export async function handleRfqRequest(
  body: unknown,
  options: RfqHandlerOptions,
  remoteAddress?: string,
): Promise<RfqHttpResult> {
  const validation = validateRfqBody(body);
  if (!validation.ok) {
    return { status: 400, body: { ok: false, detail: validation.problems.join('; '), problems: validation.problems } };
  }

  if (!options.deliver) {
    // Nothing can receive the request: say so, do not pretend.
    return {
      status: 503,
      body: {
        ok: false,
        error: 'rfq_delivery_not_configured',
        detail: 'Server has no RFQ delivery channel configured (RFQ_WEBHOOK_URL or RESEND_API_KEY/RFQ_INBOX).',
      },
    };
  }

  const now = options.now ? options.now() : new Date();
  const suffix = options.randomSuffix ? options.randomSuffix() : randomBytes(5).toString('hex').toUpperCase();
  const reference = makeReference(now, suffix);
  const record: RfqRecord = {
    ...validation.value,
    reference,
    receivedAt: now.toISOString(),
    remoteAddress,
  };

  try {
    const delivered = await options.deliver(record);
    if (!delivered.ok) {
      return {
        status: 502,
        body: { ok: false, error: 'rfq_delivery_failed', detail: delivered.detail ?? 'delivery rejected' },
      };
    }
  } catch (error) {
    return {
      status: 502,
      body: {
        ok: false,
        error: 'rfq_delivery_failed',
        detail: error instanceof Error ? error.message : String(error),
      },
    };
  }

  return { status: 200, body: { ok: true, reference } };
}

/** Fixed-window counter keyed by client address. */
export function createRateLimiter(options: { windowMs: number; max: number; now?: () => number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  const clock = options.now ?? Date.now;
  return function allow(key: string): boolean {
    const now = clock();
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= options.max;
  };
}

export interface DeliveryEnv {
  RFQ_WEBHOOK_URL?: string;
  RESEND_API_KEY?: string;
  RFQ_INBOX?: string;
  RFQ_FROM?: string;
}

/**
 * Delivery channels, in priority order:
 *   1. RFQ_WEBHOOK_URL — Google Apps Script / Sheets / Slack / any JSON sink.
 *      This is the zero-cost option for a small company: the sheet *is* the
 *      CRM record and the script sends the notification mail.
 *   2. RESEND_API_KEY + RFQ_INBOX — plain email delivery.
 * Returns null when neither is configured, which the handler reports as 503.
 */
export function deliveryFromEnv(env: DeliveryEnv, fetchImpl: typeof fetch = fetch): Delivery | null {
  const webhook = (env.RFQ_WEBHOOK_URL ?? '').trim();
  if (webhook) {
    return async record => {
      const response = await fetchImpl(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (!response.ok) return { ok: false, detail: `webhook HTTP ${response.status}` };
      return { ok: true };
    };
  }

  const key = (env.RESEND_API_KEY ?? '').trim();
  const inbox = (env.RFQ_INBOX ?? '').trim();
  if (key && inbox) {
    const from = (env.RFQ_FROM ?? 'INSCO Website <onboarding@resend.dev>').trim();
    return async record => {
      const subject = `RFQ ${record.reference} - ${record.companyName}`;
      const text = [
        `Reference: ${record.reference}`,
        `Received: ${record.receivedAt}`,
        `Company: ${record.companyName}`,
        `Contact: ${record.contactName || '-'}`,
        `Phone: ${record.phone}`,
        `Email: ${record.email}`,
        `Service: ${record.serviceType}`,
        `Location: ${record.projectLocation || '-'}`,
        '',
        record.description || '(no scope description)',
      ].join('\n');
      const response = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ from, to: [inbox], subject, text }),
      });
      if (!response.ok) return { ok: false, detail: `mail provider HTTP ${response.status}` };
      return { ok: true };
    };
  }

  return null;
}
