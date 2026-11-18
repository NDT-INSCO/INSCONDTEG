import { closeSync, constants, existsSync, fchmodSync, fstatSync, mkdirSync, openSync, realpathSync } from 'node:fs';
import { isAbsolute, join, relative, sep } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Delivery, RfqRecord } from '../../src/rfq/gateway';
import type {
  Announcement, AnnouncementInput, DashboardData, ManagedQuote, QuotePage, QuoteStatus, QuoteSummary,
} from '../../src/admin/contract';

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
  private readonly db: DatabaseSync;

  constructor(file: string) {
    this.db = new DatabaseSync(file);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS quotes (
        reference TEXT PRIMARY KEY,
        company_name TEXT NOT NULL,
        service_type TEXT NOT NULL,
        received_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'closed')),
        contact_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        project_location TEXT NOT NULL,
        description TEXT NOT NULL
      ) STRICT;
      CREATE INDEX IF NOT EXISTS quote_received ON quotes (received_at DESC, reference DESC);
      CREATE TABLE IF NOT EXISTS announcement (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
        ar TEXT NOT NULL,
        en TEXT NOT NULL,
        updated_at TEXT NOT NULL
      ) STRICT;
    `);
  }

  close() { this.db.close(); }

  addQuote(record: RfqRecord) {
    // Deliberately don't store IPs, browser URLs, or unvalidated client timestamps.
    this.db.prepare(`
      INSERT INTO quotes (reference, company_name, service_type, received_at, contact_name, phone, email, project_location, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(record.reference, record.companyName, record.serviceType, record.receivedAt,
      record.contactName, record.phone, record.email, record.projectLocation, record.description);
  }

  listQuotes(search: string, status: QuoteStatus | null, requestedPage: number): QuotePage {
    const match = `(? IS NULL OR status = ?) AND (instr(lower(company_name), lower(?)) > 0 OR instr(lower(reference), lower(?)) > 0)`;
    const args = [status, status, search, search];
    const total = Number(this.db.prepare(`SELECT COUNT(*) AS total FROM quotes WHERE ${match}`).get(...args)?.total ?? 0);
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(Math.max(1, requestedPage), pages);
    const items = this.db.prepare(`
      SELECT ${SUMMARY_FIELDS} FROM quotes WHERE ${match} ORDER BY received_at DESC, reference DESC LIMIT ? OFFSET ?
    `).all(...args, PAGE_SIZE, (page - 1) * PAGE_SIZE) as unknown as QuoteSummary[];
    return { items, page, pages, total };
  }

  quote(reference: string): ManagedQuote | undefined {
    return this.db.prepare(`
      SELECT ${SUMMARY_FIELDS}, contact_name AS contactName, phone, email, project_location AS projectLocation, description
      FROM quotes WHERE reference = ?
    `).get(reference) as unknown as ManagedQuote | undefined;
  }

  updateQuote(reference: string, status: QuoteStatus): boolean {
    return Number(this.db.prepare('UPDATE quotes SET status = ? WHERE reference = ?').run(status, reference).changes) > 0;
  }

  announcement(): Announcement {
    const row = this.db.prepare('SELECT enabled, ar, en, updated_at FROM announcement WHERE id = 1').get();
    return row
      ? { enabled: row.enabled === 1, message: { ar: String(row.ar), en: String(row.en) }, updatedAt: String(row.updated_at) }
      : { enabled: false, message: { ar: '', en: '' }, updatedAt: null };
  }

  saveAnnouncement(input: AnnouncementInput, updatedAt: string): Announcement {
    this.db.prepare(`
      INSERT INTO announcement (id, enabled, ar, en, updated_at) VALUES (1, ?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET enabled = excluded.enabled, ar = excluded.ar, en = excluded.en, updated_at = excluded.updated_at
    `).run(Number(input.enabled), input.message.ar, input.message.en, updatedAt);
    return { ...input, updatedAt };
  }

  overview(now: number): Pick<DashboardData, 'totals' | 'activity' | 'recent' | 'announcement'> {
    const cutoff = new Date(now - 2 * DAY).toISOString();
    const totals = this.db.prepare(`
      SELECT COUNT(*) AS total,
        COUNT(CASE WHEN status = 'new' THEN 1 END) AS new,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) AS in_progress,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) AS closed,
        COUNT(CASE WHEN status != 'closed' AND received_at <= ? THEN 1 END) AS overdue
      FROM quotes
    `).get(cutoff) as unknown as DashboardData['totals'];
    const days = Array.from({ length: 7 }, (_, index) => new Date(now - (6 - index) * DAY).toISOString().slice(0, 10));
    const counts = new Map(this.db.prepare(`
      SELECT substr(received_at, 1, 10) AS day, COUNT(*) AS count FROM quotes
      WHERE received_at >= ? GROUP BY day
    `).all(days[0]).map(row => [String(row.day), Number(row.count)]));
    const activity = days.map(day => ({ day, count: counts.get(day) ?? 0 }));
    const recent = this.db.prepare(`
      SELECT ${SUMMARY_FIELDS} FROM quotes ORDER BY received_at DESC, reference DESC LIMIT 4
    `).all() as unknown as QuoteSummary[];
    return { totals, activity, recent, announcement: this.announcement() };
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
      store.addQuote(record);
    } catch {
      console.error('[admin] Could not store an accepted RFQ in the private inbox.');
      // If the original channel accepted it, don't tell the customer to resend it.
      if (!primary) return { ok: false, detail: 'Could not save the quote request.' };
    }
    return { ok: true };
  };
}
