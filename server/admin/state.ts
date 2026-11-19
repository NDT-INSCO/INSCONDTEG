import { createHash, createHmac, randomBytes } from 'node:crypto';
import type { WebAuthnCredential } from '@simplewebauthn/server';
import type { AdminDatabase } from './database.js';

export const SESSION_TTL = 4 * 60 * 60_000;
export const CHALLENGE_TTL = 2 * 60_000;
export const PASSKEY_PASSWORD_WINDOW = 10 * 60_000;

export type Challenge = { kind: 'authenticate'; challenge: string }
  | { kind: 'register'; challenge: string; session: string; label: string };
export interface PasswordGrant { scope: string; token: string }
interface Session { expiresAt: number; passwordAt?: number }
type Limit = { purpose: 'password' | 'passkey' | 'rfq'; window: number; perAddress: number; total: number };

/** Cookie values are never stored; state scopes also isolate origins and credential rotations. */
export function tokenDigest(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export class AdminAuthState {
  constructor(
    private readonly db: AdminDatabase,
    private readonly scope: string,
    private readonly key: Uint8Array,
    private readonly origin: string,
  ) {}

  grant(token: string): PasswordGrant { return { scope: this.scope, token: tokenDigest(token) }; }

  async session(token: string | undefined, time: number): Promise<Session | undefined> {
    if (!token) return undefined;
    const [row] = await this.db.all(`
      SELECT issued_at, expires_at, passkey_id FROM admin_sessions
      WHERE scope = ? AND token = ? AND expires_at > ?
    `, this.scope, tokenDigest(token), time);
    return row && { expiresAt: Number(row.expires_at), passwordAt: row.passkey_id === null ? Number(row.issued_at) : undefined };
  }

  async forgetSession(token: string | undefined) {
    if (token) await this.db.run('DELETE FROM admin_sessions WHERE scope = ? AND token = ?', this.scope, tokenDigest(token));
  }

  async issueSession(previous: string | undefined, time: number, key?: WebAuthnCredential): Promise<string | null> {
    const token = randomBytes(32).toString('hex');
    await this.forgetSession(previous);
    // If revocation wins the race with verified sign-in, don't recreate a session.
    const id = key?.id ?? null;
    const added = await this.db.run(`
      INSERT INTO admin_sessions (token, scope, origin, passkey_id, issued_at, expires_at)
      SELECT ?, ?, ?, ?, ?, ?
      WHERE ? IS NULL OR EXISTS (SELECT 1 FROM passkeys WHERE origin = ? AND credential_id = ? AND public_key = ?)
    `, tokenDigest(token), this.scope, this.origin, id, time, time + SESSION_TTL, id, this.origin, id, key?.publicKey ?? null);
    return added ? token : null;
  }

  async rememberChallenge(previous: string | undefined, challenge: Challenge, time: number): Promise<string> {
    const token = randomBytes(32).toString('hex');
    if (previous) await this.db.run('DELETE FROM admin_challenges WHERE scope = ? AND token = ?', this.scope, tokenDigest(previous));
    await this.db.run(`
      INSERT INTO admin_challenges (token, scope, payload, issued_at, expires_at) VALUES (?, ?, ?, ?, ?)
    `, tokenDigest(token), this.scope, JSON.stringify(challenge), time, time + CHALLENGE_TTL);
    return token;
  }

  async consumeChallenge(token: string, time: number): Promise<Challenge | null> {
    // A single serialized delete: parallel requests/invocations cannot both use the proof.
    const [row] = await this.db.all(`
      DELETE FROM admin_challenges WHERE scope = ? AND token = ? AND expires_at > ? RETURNING payload
    `, this.scope, tokenDigest(token), time);
    return row ? JSON.parse(String(row.payload)) as Challenge : null;
  }

  private addressKey(address: string) {
    return createHmac('sha256', this.key).update(this.scope).update('\0').update(address).digest('hex');
  }

  /** Reserve both budgets before expensive work. The shared window starts on first use. */
  async throttle(address: string, time: number, { purpose, window, perAddress, total }: Limit): Promise<number> {
    const changed = await this.db.run(`
      WITH config(scope, purpose, checked_at, next_reset) AS (VALUES (?, ?, ?, ?)),
           budgets(address, cap) AS (VALUES ('', ?), (?, ?))
      INSERT INTO admin_throttle (scope, purpose, address, hits, resets_at, checked_at)
      SELECT c.scope, c.purpose, b.address, 1,
        COALESCE((SELECT resets_at FROM admin_throttle
          WHERE scope = c.scope AND purpose = c.purpose AND address = '' AND resets_at > c.checked_at), c.next_reset), c.checked_at
      FROM config c CROSS JOIN budgets b
      WHERE NOT EXISTS (
        SELECT 1 FROM admin_throttle t JOIN budgets l ON t.address = l.address
        WHERE t.scope = c.scope AND t.purpose = c.purpose AND t.resets_at > c.checked_at AND t.hits >= l.cap
      )
      ON CONFLICT (scope, purpose, address) DO UPDATE SET
        hits = CASE WHEN admin_throttle.resets_at > excluded.checked_at THEN admin_throttle.hits + 1 ELSE 1 END,
        resets_at = excluded.resets_at, checked_at = excluded.checked_at
    `, this.scope, purpose, time, time + window, total, this.addressKey(address), perAddress);
    if (changed) return 0;
    const [bucket] = await this.db.all(`SELECT resets_at FROM admin_throttle WHERE scope = ? AND purpose = ? AND address = ''`, this.scope, purpose);
    return Math.max(1, Math.ceil((Number(bucket?.resets_at ?? time + window) - time) / 1000));
  }

  async resetAddress(address: string, purpose: Limit['purpose'], time: number) {
    // Don't erase an attempt in a newer window if verification overlapped expiry.
    await this.db.run(`DELETE FROM admin_throttle WHERE scope = ? AND purpose = ? AND address = ? AND resets_at > ? AND checked_at <= ?`,
      this.scope, purpose, this.addressKey(address), time, time);
  }
}
