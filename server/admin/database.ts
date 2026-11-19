import { DatabaseSync } from 'node:sqlite';
import { createClient } from '@libsql/client/http';

export type SqlValue = string | number | null | Uint8Array;
export type SqlRow = Record<string, SqlValue | undefined>;

export interface AdminDatabase {
  all(sql: string, ...args: SqlValue[]): Promise<SqlRow[]>;
  run(sql: string, ...args: SqlValue[]): Promise<number>;
  close(): void;
}

export function localDatabase(file: string, schema: string): AdminDatabase {
  const db = new DatabaseSync(file);
  try {
    db.exec('PRAGMA busy_timeout = 5000');
    db.exec(schema);
  } catch (error) {
    db.close();
    throw error;
  }
  return {
    async all(sql, ...args) { return db.prepare(sql).all(...args) as SqlRow[]; },
    async run(sql, ...args) { return Number(db.prepare(sql).run(...args).changes); },
    close() { db.close(); },
  };
}

/** Keep database configuration server-only. In particular, never downgrade libSQL to HTTP. */
export function hostedDatabaseConfig(env: NodeJS.ProcessEnv) {
  const explicit = Boolean(env.ADMIN_DATABASE_URL?.trim() || env.ADMIN_DATABASE_AUTH_TOKEN?.trim());
  const url = (explicit ? env.ADMIN_DATABASE_URL : env.TURSO_DATABASE_URL)?.trim();
  const authToken = (explicit ? env.ADMIN_DATABASE_AUTH_TOKEN : env.TURSO_AUTH_TOKEN)?.trim();
  const stateKey = env.ADMIN_STATE_KEY;
  if (!url || !authToken || !stateKey || !/^[a-f0-9]{64}$/i.test(stateKey)) return null;
  try {
    const parsed = new URL(url);
    if (!['libsql:', 'https:'].includes(parsed.protocol) || !parsed.hostname || parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    return { url, authToken, stateKey: Buffer.from(stateKey, 'hex') };
  } catch {
    return null;
  }
}

export async function hostedDatabase(url: string, authToken: string, schema: string): Promise<AdminDatabase> {
  const db = createClient({
    url, authToken, tls: true, intMode: 'number', concurrency: 16,
    fetch: (request: RequestInfo | URL, init?: RequestInit) => fetch(request, { ...init, signal: AbortSignal.timeout(5000) }),
  });
  try {
    await db.executeMultiple(schema);
  } catch (error) {
    db.close();
    throw error;
  }
  return {
    async all(sql, ...args) {
      const result = await db.execute({ sql, args });
      return result.rows.map(row => Object.fromEntries(result.columns.map(column => {
        const value = row[column];
        return [column, value instanceof ArrayBuffer ? new Uint8Array(value) : value];
      })) as SqlRow);
    },
    async run(sql, ...args) { return (await db.execute({ sql, args })).rowsAffected; },
    close() { db.close(); },
  };
}
