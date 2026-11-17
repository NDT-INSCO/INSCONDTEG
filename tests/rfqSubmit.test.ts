/**
 * The contract the RFQ form must keep: no success without a server reference.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildRfqMailto,
  buildRfqWhatsApp,
  resolveRfqEndpoint,
  submitRfq,
  type RfqPayload,
} from '../src/rfq/submit';

const payload: RfqPayload = {
  companyName: 'Orascom Construction',
  contactName: 'Eng. Test',
  phone: '+20 109 077 7202',
  email: 'qc@orascom.com',
  serviceType: 'pwht',
  projectLocation: 'Ain Sokhna',
  description: 'P91 steam lines, ASME B31.3',
  language: 'ar',
  submittedAt: '2026-11-17T10:00:00.000Z',
};

function fakeFetch(status: number, body: unknown, ok = status < 400): typeof fetch {
  return (async () =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })) as typeof fetch;
}

test('endpoint resolution: gateway base gets /api/rfq, full endpoints are kept', () => {
  assert.equal(resolveRfqEndpoint('https://gw.example.com'), 'https://gw.example.com/api/rfq');
  assert.equal(resolveRfqEndpoint('https://gw.example.com/'), 'https://gw.example.com/api/rfq');
  assert.equal(resolveRfqEndpoint('https://gw.example.com/api/rfq'), 'https://gw.example.com/api/rfq');
  const script = 'https://script.google.com/macros/s/ABC/exec';
  assert.equal(resolveRfqEndpoint(script), script);
  assert.equal(resolveRfqEndpoint(''), '/api/rfq');
});

test('success is reported only with a server-issued reference', async () => {
  const outcome = await submitRfq(payload, {
    endpoint: '/api/rfq',
    fetchImpl: fakeFetch(200, { ok: true, reference: 'INSCO-RFQ-20261117-ABC123' }),
  });
  assert.deepEqual(outcome, { status: 'sent', reference: 'INSCO-RFQ-20261117-ABC123' });
});

test('a 2xx without a reference is a failure, not a success', async () => {
  const outcome = await submitRfq(payload, { endpoint: '/api/rfq', fetchImpl: fakeFetch(200, { ok: true }) });
  assert.equal(outcome.status, 'failed');
  if (outcome.status === 'failed') assert.equal(outcome.reason, 'server');
});

test('a static host answering 404 means “not configured”, not “sent”', async () => {
  const outcome = await submitRfq(payload, { endpoint: '/api/rfq', fetchImpl: fakeFetch(404, {}) });
  assert.equal(outcome.status, 'failed');
  if (outcome.status === 'failed') assert.equal(outcome.reason, 'not_configured');
});

test('validation and server errors stay distinct and retryable', async () => {
  const bad = await submitRfq(payload, { endpoint: '/api/rfq', fetchImpl: fakeFetch(400, { detail: 'email is required' }) });
  assert.equal(bad.status, 'failed');
  if (bad.status === 'failed') assert.equal(bad.reason, 'validation');

  const broken = await submitRfq(payload, { endpoint: '/api/rfq', fetchImpl: fakeFetch(502, { detail: 'mail provider HTTP 500' }) });
  assert.equal(broken.status, 'failed');
  if (broken.status === 'failed') assert.equal(broken.reason, 'server');
});

test('network failures never look like success', async () => {
  const throwing = (async () => {
    throw new Error('ECONNREFUSED');
  }) as typeof fetch;
  const outcome = await submitRfq(payload, { endpoint: '/api/rfq', fetchImpl: throwing });
  assert.equal(outcome.status, 'failed');
  if (outcome.status === 'failed') assert.equal(outcome.reason, 'network');
});

test('mail and WhatsApp hand-off carry every filled field', () => {
  const mailto = buildRfqMailto(payload, 'insco50@yahoo.com', 'ar');
  assert.ok(mailto.startsWith('mailto:insco50@yahoo.com?'));
  const decoded = decodeURIComponent(mailto);
  assert.ok(decoded.includes('Orascom Construction'));
  assert.ok(decoded.includes('+20 109 077 7202'));
  assert.ok(decoded.includes('P91 steam lines'));

  const wa = buildRfqWhatsApp(payload, '+20 109 077 7202', 'en');
  assert.ok(wa.startsWith('https://wa.me/201090777202?text='));
  assert.ok(decodeURIComponent(wa).includes('RFQ — INSCO'));
});
