import { isIP } from 'node:net';
import express, { type Request, type RequestHandler, type Response } from 'express';
import {
  generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse,
  type AuthenticationResponseJSON, type RegistrationResponseJSON, type WebAuthnCredential,
} from '@simplewebauthn/server';
import { decodeClientDataJSON } from '@simplewebauthn/server/helpers';
import { ADMIN_API, PASSKEY_LABEL_LIMIT, PASSKEY_LIMIT, type PasskeySettings } from '../../src/admin/contract.js';
import { clientAddress, fail, readJsonBody, readTokenCookie, runAsync } from './http.js';
import { CHALLENGE_TTL, type AdminAuthState, type Challenge, type PasswordGrant } from './state.js';
import type { AdminStore } from './store.js';

const COOKIE = 'insco_passkey_challenge';
const PROMPT_TIMEOUT = 90_000;

function passkeySite(origin: string | null) {
  if (!origin) return null; // Never derive the relying party from an arbitrary Host header.
  const { hostname, protocol } = new URL(origin);
  if (hostname === 'localhost' || (protocol === 'https:' && hostname.includes('.') && !hostname.endsWith('.') && !isIP(hostname))) {
    return { origin, rpID: hostname };
  }
  return null;
}

function credentialId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,1364}$/.test(value);
}

function credentialResponse<T extends AuthenticationResponseJSON | RegistrationResponseJSON>(req: Request): T | null {
  const value = req.body?.response;
  if (value?.type !== 'public-key' || !credentialId(value.id) || value.id !== value.rawId || typeof value.response?.clientDataJSON !== 'string') return null;
  try {
    const data = decodeClientDataJSON(value.response.clientDataJSON);
    // Sign-in and enrollment are performed at the admin site, not embedded in another site.
    if (data.crossOrigin || data.topOrigin) return null;
    return value as T;
  } catch {
    return null;
  }
}

interface PasskeyRouterOptions {
  origin: string | null;
  store: AdminStore;
  state: AdminAuthState;
  now: () => number;
  requireSession: RequestHandler;
  canManage: (res: Response) => boolean;
  signIn: (req: Request, res: Response, credential: WebAuthnCredential) => Promise<void>;
}

export function createPasskeyRouter({ origin, store, state, now, requireSession, canManage, signIn }: PasskeyRouterOptions) {
  const router = express.Router();
  const site = passkeySite(origin);
  const normalJson = readJsonBody();
  const proofJson = readJsonBody('32kb');

  function cookieOptions() {
    return { httpOnly: true, sameSite: 'strict' as const, secure: Boolean(site?.origin.startsWith('https:')), path: `${ADMIN_API}/passkeys` };
  }

  async function remember(req: Request, res: Response, challenge: Challenge) {
    const token = await state.rememberChallenge(readTokenCookie(req, COOKIE), challenge, now());
    res.cookie(COOKIE, token, { ...cookieOptions(), maxAge: CHALLENGE_TTL });
  }

  async function consume(req: Request, res: Response): Promise<Challenge | null> {
    const token = readTokenCookie(req, COOKIE);
    if (!token) return null;
    res.clearCookie(COOKIE, cookieOptions());
    return state.consumeChallenge(token, now());
  }

  // No credential identifiers, labels, or account handle are public.
  router.get('/status', runAsync(async (_req, res) => {
    res.json({ available: Boolean(site && await store.countPasskeys(site.origin)) });
  }));

  router.post('/authenticate/options', normalJson, runAsync(async (req, res) => {
    if (!site) return fail(res, 503, 'passkey_not_configured');
    if (!await store.countPasskeys(site.origin)) return fail(res, 409, 'no_passkeys');
    // Independent of the password budget so recovery remains available.
    const retry = await state.throttle(clientAddress(req), now(), { purpose: 'passkey', window: CHALLENGE_TTL, perAddress: 8, total: 60 });
    if (retry) {
      res.set('Retry-After', String(retry));
      return fail(res, 429, 'rate_limited');
    }
    const options = await generateAuthenticationOptions({ rpID: site.rpID, userVerification: 'required', timeout: PROMPT_TIMEOUT });
    await remember(req, res, { kind: 'authenticate', challenge: options.challenge });
    res.json(options);
  }));

  router.post('/authenticate/verify', proofJson, runAsync(async (req, res) => {
    if (!site) return fail(res, 503, 'passkey_not_configured');
    const pending = await consume(req, res);
    if (pending?.kind !== 'authenticate') return fail(res, 400, 'passkey_challenge_expired');
    const response = credentialResponse<AuthenticationResponseJSON>(req);
    const credential = response && await store.passkey(site.origin, response.id);
    const userHandle = await store.passkeyUserHandle(site.origin);
    if (!credential || !response || !userHandle || response.response.userHandle !== userHandle) {
      return fail(res, 401, 'passkey_verification_failed');
    }
    const result = await verifyAuthenticationResponse({
      response, credential,
      expectedChallenge: pending.challenge, expectedOrigin: site.origin, expectedRPID: site.rpID,
      requireUserVerification: true,
    }).catch(() => null);
    if (!result?.verified || !await store.usePasskey(site.origin, credential, result.authenticationInfo.newCounter, new Date(now()).toISOString())) {
      return fail(res, 401, 'passkey_verification_failed');
    }
    await signIn(req, res, credential);
  }));

  router.use(requireSession);

  router.get('/', runAsync(async (_req, res) => {
    const data: PasskeySettings = { enabled: Boolean(site), canManage: Boolean(site && canManage(res)), items: site ? await store.listPasskeys(site.origin) : [] };
    res.json(data);
  }));

  router.post('/register/options', normalJson, runAsync(async (req, res) => {
    if (!site) return fail(res, 503, 'passkey_not_configured');
    if (!canManage(res)) return fail(res, 403, 'passkey_password_required');
    const label = typeof req.body?.label === 'string' ? req.body.label.trim() : '';
    if (!label || label.length > PASSKEY_LABEL_LIMIT || /[\u0000-\u001f\u007f]/.test(label)) return fail(res, 400, 'invalid_request');
    const existing = await store.listPasskeys(site.origin);
    if (existing.length >= PASSKEY_LIMIT) return fail(res, 409, 'passkey_limit');
    const options = await generateRegistrationOptions({
      rpName: 'INSCO Site Administration', rpID: site.rpID,
      userName: 'admin', userDisplayName: 'INSCO Administrator',
      userID: Buffer.from(await store.ensurePasskeyUserHandle(site.origin), 'base64url'),
      excludeCredentials: existing.map(({ id }) => ({ id })),
      attestationType: 'none', timeout: PROMPT_TIMEOUT,
      authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
    });
    await remember(req, res, { kind: 'register', challenge: options.challenge, session: (res.locals.sessionGrant as PasswordGrant).token, label });
    res.json(options);
  }));

  router.post('/register/verify', proofJson, runAsync(async (req, res) => {
    if (!site) return fail(res, 503, 'passkey_not_configured');
    if (!canManage(res)) return fail(res, 403, 'passkey_password_required');
    const pending = await consume(req, res);
    if (pending?.kind !== 'register' || pending.session !== (res.locals.sessionGrant as PasswordGrant).token) return fail(res, 400, 'passkey_challenge_expired');
    const response = credentialResponse<RegistrationResponseJSON>(req);
    if (!response) return fail(res, 400, 'passkey_registration_failed');
    const result = await verifyRegistrationResponse({
      response, expectedChallenge: pending.challenge, expectedOrigin: site.origin, expectedRPID: site.rpID,
      requireUserVerification: true, requireUserPresence: true,
    }).catch(() => null);
    if (!result?.verified || result.registrationInfo.credential.id !== response.id) return fail(res, 400, 'passkey_registration_failed');
    const { credential } = result.registrationInfo;
    const time = now();
    const grant = res.locals.sessionGrant as PasswordGrant;
    if (!canManage(res)) return fail(res, 403, 'passkey_password_required');
    if (!await store.addPasskey(site.origin, credential, pending.label, time, grant)) {
      // The conditional insert also checks that the password session is still active.
      if (await store.countPasskeys(site.origin) >= PASSKEY_LIMIT) return fail(res, 409, 'passkey_limit');
      if (await store.passkey(site.origin, credential.id)) return fail(res, 409, 'passkey_exists');
      return fail(res, 403, 'passkey_password_required');
    }
    const createdAt = new Date(time).toISOString();
    res.status(201).json({ id: credential.id, label: pending.label, createdAt, lastUsedAt: null });
  }));

  router.delete('/:id', runAsync(async (req, res) => {
    if (!site) return fail(res, 503, 'passkey_not_configured');
    if (!canManage(res)) return fail(res, 403, 'passkey_password_required');
    if (!credentialId(req.params.id) || !await store.removePasskey(site.origin, req.params.id)) return fail(res, 404, 'passkey_not_found');
    res.status(204).end();
  }));

  return router;
}
