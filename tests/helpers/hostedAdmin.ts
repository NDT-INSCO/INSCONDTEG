import assert from 'node:assert/strict';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import type { TestContext } from 'node:test';

type WireValue = { type: string; value?: string | number; base64?: string };
function decode(v: WireValue): SQLInputValue {
  if (v.type === 'null') return null;
  if (v.type === 'blob') return Buffer.from(v.base64!, 'base64');
  return v.type === 'text' ? String(v.value) : Number(v.value);
}
function encode(v: unknown): WireValue {
  if (v === null) return { type: 'null' };
  if (v instanceof Uint8Array) return { type: 'blob', base64: Buffer.from(v).toString('base64') };
  if (typeof v === 'number') return Number.isInteger(v) ? { type: 'integer', value: String(v) } : { type: 'float', value: v };
  return { type: 'text', value: String(v) };
}

/** Exercise the real libSQL HTTP client offline against a small SQLite-backed Hrana fixture. */
export function fakeDatabase(t: TestContext, url: string, token: string) {
  const db = new DatabaseSync(':memory:');
  let online = true;
  let schemaLoads = 0;
  t.mock.method(globalThis, 'fetch', async (req: Request) => {
    assert.equal(req.url, `${url}/v2/pipeline`);
    assert.equal(req.headers.get('authorization'), `Bearer ${token}`);
    if (!online) return new Response(null, { status: 503 });
    const packet = await req.json() as { requests: { type: string; sql?: string; stmt?: { sql: string; args: WireValue[] } }[] };
    const results = packet.requests.map(({ type, sql, stmt }) => {
      if (type === 'sequence') { schemaLoads += 1; db.exec(sql!); }
      if (type !== 'execute') {
        assert.ok(['sequence', 'close'].includes(type));
        return { type: 'ok', response: { type } };
      }
      assert.ok(stmt);
      const rows = db.prepare(stmt.sql).all(...stmt.args.map(decode));
      const cols = Object.keys(rows[0] ?? {});
      return { type: 'ok', response: { type, result: {
        cols: cols.map(name => ({ name, decltype: null })), rows: rows.map(row => cols.map(key => encode(row[key]))),
        affected_row_count: Number(db.prepare('SELECT changes() AS n').get()?.n), last_insert_rowid: null,
      } } };
    });
    return Response.json({ baton: null, base_url: null, results });
  });
  t.after(() => db.close());
  return { db, outage: () => { online = false; }, restore: () => { online = true; }, schemaLoads: () => schemaLoads };
}
