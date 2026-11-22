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
import { RFQ_FIELD_LIMITS, validRfqEmail, normalizeRfqPhone } from './validation.js';

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
  reportFailure?: (reason: 'provider_rejected' | 'provider_unreachable') => void;
}

export interface RfqHttpResult {
  status: number;
  body: Record<string, unknown>;
}

const REQUIRED_FIELDS = ['companyName', 'phone', 'email'] as const;

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
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { ok: false, problems: ['body must be a JSON object'] };
  const input = body as Record<string, unknown>;
  const problems: string[] = [];

  // Honeypot: a real visitor never fills a field that is hidden from them.
  if (input.website !== undefined && input.website !== '') {
    return { ok: false, problems: ['honeypot'] };
  }

  const text = (key: string): string => (typeof input[key] === 'string' ? (input[key] as string).trim() : '');

  for (const field of REQUIRED_FIELDS) {
    if (!text(field)) problems.push(`${field} is required`);
  }
  if (text('email') && !validRfqEmail(text('email'))) problems.push('email is not a valid address');
  const phone = normalizeRfqPhone(text('phone'));
  if (text('phone') && !phone) problems.push('phone is not a valid number');
  for (const [field, max] of Object.entries(RFQ_FIELD_LIMITS)) {
    if (input[field] !== undefined && typeof input[field] !== 'string') problems.push(`${field} must be text`);
    if (text(field).length > max) problems.push(`${field} exceeds ${max} characters`);
  }

  if (problems.length > 0) return { ok: false, problems };

  const language = text('language') === 'en' ? 'en' : 'ar';
  return {
    ok: true,
    value: {
      companyName: text('companyName'),
      contactName: text('contactName'),
      phone: phone!,
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
        detail: 'Online intake is not configured.',
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
      options.reportFailure?.('provider_rejected');
      return {
        status: 502,
        body: { ok: false, error: 'rfq_delivery_failed', detail: 'The receiving service did not acknowledge the request.' },
      };
    }
  } catch {
    options.reportFailure?.('provider_unreachable');
    return {
      status: 502,
      body: {
        ok: false,
        error: 'rfq_delivery_failed',
        detail: 'The receiving service did not acknowledge the request.',
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
 *   1. RFQ_WEBHOOK_URL — a private HTTPS receiver that echoes the saved reference.
 * *   2. RESEND_API_KEY + RFQ_INBOX — plain email delivery.
 * Returns null when neither is configured, which the handler reports as 503.
 */
export function deliveryFromEnv(env: DeliveryEnv, fetchImpl: typeof fetch = fetch): Delivery | null {
  const webhook = (env.RFQ_WEBHOOK_URL ?? '').trim();
  if (webhook && /^https:\/\//i.test(webhook)) {
    return async record => {
      const response = await fetchImpl(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) return { ok: false, detail: `webhook HTTP ${response.status}` };
      const ack: unknown = await response.json().catch(() => null);
      if (!ack || typeof ack !== 'object' || !('ok' in ack) || ack.ok !== true ||
          !('reference' in ack) || ack.reference !== record.reference) {
        return { ok: false, detail: 'webhook did not acknowledge this reference' };
      }
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
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) return { ok: false, detail: `mail provider HTTP ${response.status}` };
      const ack: unknown = await response.json().catch(() => null);
      return ack && typeof ack === 'object' && 'id' in ack && typeof ack.id === 'string' && ack.id.trim()
        ? { ok: true }
        : { ok: false, detail: 'mail provider did not acknowledge the message' };
    };
  }

  return null;
}
