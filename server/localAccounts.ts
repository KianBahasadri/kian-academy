import { mkdirSync, chmodSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { Readable } from 'node:stream';
import type { Connect } from 'vite';
import { createAccountApi } from './accountApi.ts';
import type { AccountConfig } from './accountApi.ts';
import type { AccountDatabase, Statement } from './accountStore.ts';

export function localAccounts(config: AccountConfig, databasePath = '.data/accounts.sqlite') {
  const path = resolve(databasePath);
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const sqlite = new DatabaseSync(path);
  chmodSync(path, 0o600);
  sqlite.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  sqlite.exec('CREATE TABLE IF NOT EXISTS academy_migrations (name TEXT PRIMARY KEY);');
  for (const filename of readdirSync('cloudflare/migrations').filter(file => file.endsWith('.sql')).sort()) {
    if (sqlite.prepare('SELECT name FROM academy_migrations WHERE name = ?').get(filename)) continue;
    sqlite.exec('BEGIN IMMEDIATE');
    try {
      sqlite.exec(readFileSync(`cloudflare/migrations/${filename}`, 'utf8'));
      sqlite.prepare('INSERT INTO academy_migrations (name) VALUES (?)').run(filename);
      sqlite.exec('COMMIT');
    } catch (error) { sqlite.exec('ROLLBACK'); sqlite.close(); throw error; }
  }
  class LocalStatement implements Statement {
    readonly sql: string;
    readonly values: (string | number | null)[];
    constructor(sql: string, values: (string | number | null)[] = []) { this.sql = sql; this.values = values; }
    bind(...values: (string | number | null)[]) { return new LocalStatement(this.sql, values); }
    async all<T>() { return { results: sqlite.prepare(this.sql).all(...this.values) as T[] }; }
    async run() { return { meta: { changes: Number(sqlite.prepare(this.sql).run(...this.values).changes) } }; }
  }
  const db: AccountDatabase = {
    prepare: sql => new LocalStatement(sql),
    async batch(statements) {
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        const results = statements.map(statement => {
          const local = statement as LocalStatement;
          return { meta: { changes: Number(sqlite.prepare(local.sql).run(...local.values).changes) } };
        });
        sqlite.exec('COMMIT');
        return results;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  const api = createAccountApi(db, config);
  const middleware: Connect.NextHandleFunction = async (req, res, next) => {
    if (!req.url?.startsWith('/api/')) { next(); return; }
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) if (value) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
    const method = req.method ?? 'GET';
    const url = new URL(req.url, config.origins[0]);
    const body = ['GET', 'HEAD'].includes(method) ? undefined : Readable.toWeb(req) as ReadableStream<Uint8Array>;
    try {
      const response = url.pathname === '/api/health' ? Response.json({ status: 'ok', release: 'local' }) : await api(new Request(url, { method, headers, body, ...(body ? { duplex: 'half' } : {}) } as RequestInit));
      res.statusCode = response.status;
      response.headers.forEach((value, name) => res.setHeader(name, value));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch { res.statusCode = 503; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ error: 'Account storage is unavailable.' })); }
  };
  return { middleware, close: () => sqlite.close() };
}
