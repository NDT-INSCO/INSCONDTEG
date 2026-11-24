import { randomBytes } from 'node:crypto';
import { closeSync, constants, existsSync, fchmodSync, fstatSync, mkdirSync, openSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';
import { localDatabase, type AdminDatabase } from './database.js';
import { ADMIN_SCHEMA } from './schema.js';
import { AdminAuthState, PASSKEY_PASSWORD_WINDOW, type PasswordGrant } from './state.js';
import type { WebAuthnCredential } from '@simplewebauthn/server';
import type { Delivery, RfqRecord } from '../../src/rfq/gateway.js';
import { PASSKEY_LIMIT } from '../../src/admin/contract.js';
import { factorySnapshot, type FactorySnapshot } from '../../src/admin/factory.js';
import type {
  Announcement, AnnouncementInput, DashboardData, ManagedQuote, PasskeySummary, QuotePage, QuoteStatus, QuoteSummary,
} from '../../src/admin/contract.js';

const PAGE_SIZE = 12;
const DAY = 86_400_000;
const SUMMARY_FIELDS = 'reference, company_name AS companyName, service_type AS serviceType, received_at AS receivedAt, status';

export function adminDatabasePath(dataDir: string, publicRoots: string[]): string {
  // Check both the configured path and its resolved destination, including symlinks.
  const roots = publicRoots.flatMap(root => existsSync(root) ? [root, realpathSync(root)] : [root]);
  const check = (directory: string) => {
    for (const root of roots) {
      const fromRoot = relative(root, directory);
      if (!fromRoot || (!isAbsolute(fromRoot) && fromRoot !== '..' && !fromRoot.startsWith(`..${sep}`))) {
        throw new Error('ADMIN_DATA_DIR cannot be inside a public site directory');
      }
    }
  };
  check(dataDir);
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const directory = realpathSync(dataDir);
  check(directory);
  const databasePath = join(directory, 'admin.sqlite');
  // A pre-existing DB symlink must not turn a public asset into a private store.
  const fd = openSync(databasePath, constants.O_CREAT | constants.O_WRONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK, 0o600);
  try {
    const stat = fstatSync(fd);
    if (!stat.isFile() || stat.nlink !== 1) throw new Error('Use a regular private file for admin.sqlite');
    fchmodSync(fd, 0o600);
  } finally {
    closeSync(fd);
  }
  return databasePath;
}

export class AdminStore {
  private readonly db: AdminDatabase;

  constructor(file: string | AdminDatabase) {
    this.db = typeof file === 'string' ? localDatabase(file, ADMIN_SCHEMA) : file;
  }

  auth(scope: string, key: Uint8Array, origin: string | null) {
    return new AdminAuthState(this.db, scope, key, origin ?? '');
  }

  close() { this.db.close(); }

  async passkeyUserHandle(origin: string): Promise<string | undefined> {
    const [row] = await this.db.all('SELECT user_handle FROM passkey_accounts WHERE origin = ?', origin);
    return row?.user_handle as string | undefined;
  }

  async ensurePasskeyUserHandle(origin: string): Promise<string> {
    // Two instances starting enrollment at once must agree on the same account handle.
    const created = randomBytes(32).toString('base64url');
    await this.db.run('INSERT INTO passkey_accounts (origin, user_handle) VALUES (?, ?) ON CONFLICT DO NOTHING', origin, created);
    const handle = await this.passkeyUserHandle(origin);
    if (!handle) throw new Error('No passkey account');
    return handle;
  }

  async countPasskeys(origin: string): Promise<number> {
    const [row] = await this.db.all('SELECT COUNT(*) AS count FROM passkeys WHERE origin = ?', origin);
    return Number(row?.count ?? 0);
  }

  async listPasskeys(origin: string): Promise<PasskeySummary[]> {
    return await this.db.all(`
      SELECT credential_id AS id, label, created_at AS createdAt, last_used_at AS lastUsedAt
      FROM passkeys WHERE origin = ? ORDER BY created_at DESC, credential_id
    `, origin) as unknown as PasskeySummary[];
  }

  async passkey(origin: string, id: string): Promise<WebAuthnCredential | undefined> {
    const [row] = await this.db.all(`
      SELECT credential_id AS id, public_key AS publicKey, sign_count AS counter
      FROM passkeys WHERE origin = ? AND credential_id = ?
    `, origin, id);
    return row as unknown as WebAuthnCredential | undefined;
  }

  async addPasskey(origin: string, credential: WebAuthnCredential, label: string, time: number, grant: PasswordGrant): Promise<boolean> {
    // Enforce both the recent password grant and capacity in the same write as enrollment.
    return (await this.db.run(`
      INSERT INTO passkeys (origin, credential_id, public_key, sign_count, label, created_at)
      SELECT ?, ?, ?, ?, ?, ?
      WHERE (SELECT count(*) FROM passkeys WHERE origin = ?) < ?
        AND EXISTS (SELECT 1 FROM admin_sessions WHERE scope = ? AND token = ? AND origin = ?
          AND passkey_id IS NULL AND expires_at > ? AND issued_at > ?)
      ON CONFLICT (origin, credential_id) DO NOTHING
    `, origin, credential.id, credential.publicKey, credential.counter, label, new Date(time).toISOString(),
    origin, PASSKEY_LIMIT, grant.scope, grant.token, origin, time, time - PASSKEY_PASSWORD_WINDOW)) > 0;
  }

  async usePasskey(origin: string, credential: WebAuthnCredential, counter: number, usedAt: string): Promise<boolean> {
    // The verification can yield while a concurrent request updates or revokes this credential.
    return (await this.db.run(`
      UPDATE passkeys SET sign_count = ?, last_used_at = ?
      WHERE origin = ? AND credential_id = ? AND sign_count = ? AND public_key = ?
    `, counter, usedAt, origin, credential.id, credential.counter, credential.publicKey)) > 0;
  }

  async removePasskey(origin: string, id: string): Promise<boolean> {
    return (await this.db.run('DELETE FROM passkeys WHERE origin = ? AND credential_id = ?', origin, id)) > 0;
  }

  async addQuote(record: RfqRecord) {
    // Deliberately don't store IPs, browser URLs, or unvalidated client timestamps.
    await this.db.run(`
      INSERT INTO quotes (reference, company_name, service_type, received_at, contact_name, phone, email, project_location, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, record.reference, record.companyName, record.serviceType, record.receivedAt,
      record.contactName, record.phone, record.email, record.projectLocation, record.description);
  }

  async listQuotes(search: string, status: QuoteStatus | null, requestedPage: number): Promise<QuotePage> {
    const match = `(? IS NULL OR status = ?) AND (instr(lower(company_name), lower(?)) > 0 OR instr(lower(reference), lower(?)) > 0)`;
    const args = [status, status, search, search];
    const [row] = await this.db.all(`SELECT COUNT(*) AS total FROM quotes WHERE ${match}`, ...args);
    const total = Number(row?.total ?? 0);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(Math.max(1, requestedPage), pages);
    const items = await this.db.all(`
      SELECT ${SUMMARY_FIELDS} FROM quotes WHERE ${match} ORDER BY received_at DESC, reference DESC LIMIT ? OFFSET ?
    `, ...args, PAGE_SIZE, (page - 1) * PAGE_SIZE) as unknown as QuoteSummary[];
    return { items, page, pages, total };
  }

  async quote(reference: string): Promise<ManagedQuote | undefined> {
    const [row] = await this.db.all(`
      SELECT ${SUMMARY_FIELDS}, contact_name AS contactName, phone, email, project_location AS projectLocation, description
      FROM quotes WHERE reference = ?
    `, reference);
    return row as unknown as ManagedQuote | undefined;
  }

  async updateQuote(reference: string, status: QuoteStatus): Promise<boolean> {
    return (await this.db.run('UPDATE quotes SET status = ? WHERE reference = ?', status, reference)) > 0;
  }

  async announcement(): Promise<Announcement> {
    const [row] = await this.db.all('SELECT enabled, ar, en, updated_at FROM announcement WHERE id = 1');
    return row
      ? { enabled: row.enabled === 1, message: { ar: String(row.ar), en: String(row.en) }, updatedAt: String(row.updated_at) }
      : { enabled: false, message: { ar: '', en: '' }, updatedAt: null };
  }

  async saveAnnouncement(input: AnnouncementInput, updatedAt: string): Promise<Announcement> {
    await this.db.run(`
      INSERT INTO announcement (id, enabled, ar, en, updated_at) VALUES (1, ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET enabled = excluded.enabled, ar = excluded.ar, en = excluded.en, updated_at = excluded.updated_at
    `, Number(input.enabled), input.message.ar, input.message.en, updatedAt);
    return { ...input, updatedAt };
  }

  private async quoteTotals(now: number): Promise<DashboardData['totals']> {
    const cutoff = new Date(now - 2 * DAY).toISOString();
    const [totals] = await this.db.all(`
      SELECT COUNT(*) AS total,
        COUNT(CASE WHEN status = 'new' THEN 1 END) AS new,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) AS in_progress,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) AS closed,
        COUNT(CASE WHEN status != 'closed' AND received_at <= ? THEN 1 END) AS overdue
      FROM quotes
    `, cutoff);
    return totals as unknown as DashboardData['totals'];
  }

  /** Do not even read individual records or announcement text for the model. */
  async factoryContext(now: number): Promise<FactorySnapshot> {
    const [totals, [announcement]] = await Promise.all([
      this.quoteTotals(now), this.db.all('SELECT enabled FROM announcement WHERE id = 1'),
    ]);
    return factorySnapshot({ updatedAt: new Date(now).toISOString(), totals, announcement: { enabled: announcement?.enabled === 1 } });
  }

  async overview(now: number): Promise<Pick<DashboardData, 'totals' | 'activity' | 'recent' | 'announcement'>> {
    const days = Array.from({ length: 7 }, (_, index) => new Date(now - (6 - index) * DAY).toISOString().slice(0, 10));
    const [totals, rows, recent, announcement] = await Promise.all([
      this.quoteTotals(now),
      this.db.all(`SELECT substr(received_at, 1, 10) AS day, COUNT(*) AS count FROM quotes
        WHERE received_at >= ? GROUP BY day`, days[0]),
      this.db.all(`SELECT ${SUMMARY_FIELDS} FROM quotes ORDER BY received_at DESC, reference DESC LIMIT 4`),
      this.announcement(),
    ]);
    const counts = new Map(rows.map(row => [String(row.day), Number(row.count)]));
    const activity = days.map(day => ({ day, count: counts.get(day) ?? 0 }));
    return { totals, activity, recent: recent as unknown as QuoteSummary[], announcement };
  }
}

/** Preserve an existing delivery channel. Without one, a durable inbox write is delivery. */
export function deliverToInbox(store: AdminStore, primary: Delivery | null): Delivery {
  return async record => {
    if (primary) {
      const result = await primary(record);
      if (!result.ok) return result;
    }
    try {
      await store.addQuote(record);
    } catch {
      console.error('[admin] Could not store an accepted RFQ in the private inbox.');
      // If the original channel accepted it, don't tell the customer to resend it.
      if (!primary) return { ok: false, detail: 'Could not save the quote request.' };
    }
    return { ok: true };
  };
}
