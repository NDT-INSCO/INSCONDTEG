/**
 * Server-side RFQ intake: a quote request is only "received" once a delivery
 * channel acknowledged it.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createRateLimiter,
  deliveryFromEnv,
  handleRfqRequest,
  makeReference,
  validateRfqBody,
} from '../src/rfq/gateway';

const body = {
  companyName: 'Petrobel',
  contactName: 'Eng. Site',
  phone: '+20 100 000 0000',
  email: 'procurement@petrobel.com',
  serviceType: 'pwht',
  projectLocation: 'Port Said',
  description: '16 units mobilization',
  language: 'en',
  submittedAt: '2026-11-17T09:00:00.000Z',
};

test('validation rejects incomplete or malformed requests', () => {
  const empty = validateRfqBody({});
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.ok(empty.problems.some(p => p.includes('companyName')));

  const badEmail = validateRfqBody({ ...body, email: 'not-an-email' });
  assert.equal(badEmail.ok, false);

  const shortPhone = validateRfqBody({ ...body, phone: '12' });
  assert.equal(shortPhone.ok, false);
  assert.equal(validateRfqBody({ ...body, phone: 'foo123456789' }).ok, false);
  assert.equal(validateRfqBody({ ...body, description: 'x'.repeat(4001) }).ok, false);
  assert.equal(validateRfqBody({ ...body, contactName: 123 }).ok, false);

  const honeypot = validateRfqBody({ ...body, website: 'http://spam.example' });
  assert.equal(honeypot.ok, false);
});

test('validation accepts a complete request and normalises language', () => {
  const result = validateRfqBody({ ...body, language: 'en' });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.language, 'en');
    assert.equal(result.value.email, 'procurement@petrobel.com');
    assert.equal(result.value.phone, '+201000000000');
  }
});

test('no delivery channel means 503 — never a fake confirmation', async () => {
  const result = await handleRfqRequest(body, { deliver: null });
  assert.equal(result.status, 503);
  assert.equal(result.body.ok, false);
  assert.equal(result.body.error, 'rfq_delivery_not_configured');
});

test('a delivered request returns 200 with a dated reference', async () => {
  let received: unknown = null;
  const result = await handleRfqRequest(
    body,
    {
      deliver: async record => {
        received = record;
        return { ok: true };
      },
      now: () => new Date('2026-11-17T09:30:00.000Z'),
      randomSuffix: () => 'AB12CD',
    },
    '203.0.113.9',
  );

  assert.equal(result.status, 200);
  assert.equal(result.body.reference, 'INSCO-RFQ-20261117-AB12CD');
  const record = received as { reference: string; companyName: string; remoteAddress?: string };
  assert.equal(record.companyName, 'Petrobel');
  assert.equal(record.reference, result.body.reference);
  assert.equal(record.remoteAddress, '203.0.113.9');
});

test('a rejected delivery is a 502 and carries no reference', async () => {
  const result = await handleRfqRequest(body, {
    deliver: async () => ({ ok: false, detail: 'webhook HTTP 500' }),
  });
  assert.equal(result.status, 502);
  assert.equal(result.body.ok, false);
  assert.equal(result.body.reference, undefined);

  const reasons: string[] = [];
  const throwing = await handleRfqRequest(body, {
    reportFailure: reason => reasons.push(reason),
    deliver: async () => {
      throw new Error('socket hang up');
    },
  });
  assert.equal(throwing.status, 502);
  assert.equal(throwing.body.reference, undefined);
  assert.doesNotMatch(String(throwing.body.detail), /socket hang up/);
  assert.deepEqual(reasons, ['provider_unreachable']);
});

test('reference shape is stable and date-stamped', () => {
  assert.equal(makeReference(new Date('2027-01-05T00:00:00.000Z'), 'ZZ9'), 'INSCO-RFQ-20270105-ZZ9');
});

test('rate limiter blocks the seventh attempt inside the window', () => {
  let clock = 1_000;
  const allow = createRateLimiter({ windowMs: 60_000, max: 6, now: () => clock });
  for (let i = 0; i < 6; i += 1) assert.equal(allow('1.2.3.4'), true);
  assert.equal(allow('1.2.3.4'), false);
  assert.equal(allow('5.6.7.8'), true);
  clock += 60_001;
  assert.equal(allow('1.2.3.4'), true);
});

test('deliveryFromEnv returns null when nothing is configured', () => {
  assert.equal(deliveryFromEnv({}), null);
  assert.equal(deliveryFromEnv({ RESEND_API_KEY: 'k' }), null);
});

test('webhook delivery reports provider failures instead of swallowing them', async () => {
  const delivery = deliveryFromEnv({ RFQ_WEBHOOK_URL: 'https://hook.example/rfq' }, (async () =>
    new Response('nope', { status: 500 })) as typeof fetch);
  assert.ok(delivery);
  const outcome = await delivery!({
    ...body,
    language: 'en' as const,
    reference: 'INSCO-RFQ-20261117-AAAAAA',
    receivedAt: '2026-11-17T09:30:00.000Z',
  });
  assert.equal(outcome.ok, false);
});


test('webhooks must acknowledge the saved reference, not just return HTTP 200', async () => {
  const webhookEnv = { RFQ_WEBHOOK_URL: 'https://hook.example/rfq' };
  const wrong = deliveryFromEnv(webhookEnv, (async () => Response.json({ ok: true, reference: 'other' })) as typeof fetch);
  assert.equal((await handleRfqRequest(body, { deliver: wrong })).status, 502);
  const receiver = deliveryFromEnv(webhookEnv, (async (_url, options) => {
    const record = JSON.parse(String(options?.body));
    return Response.json({ ok: true, reference: record.reference });
  }) as typeof fetch);
  const result = await handleRfqRequest(body, { deliver: receiver });
  assert.equal(result.status, 200);
  assert.match(result.body.reference ?? '', /^INSCO-RFQ-/);
});

test('email receipt requires an acknowledgement ID from the configured provider', async () => {
  const env = { RESEND_API_KEY: 'unit-test', RFQ_INBOX: 'test@example.org' };
  const empty = deliveryFromEnv(env, (async () => Response.json({})) as typeof fetch);
  assert.equal((await handleRfqRequest(body, { deliver: empty })).status, 502);
  const accepted = deliveryFromEnv(env, (async () => Response.json({ id: 'provider-test-id' })) as typeof fetch);
  assert.equal((await handleRfqRequest(body, { deliver: accepted })).status, 200);
});
