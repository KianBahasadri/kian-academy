import { createHash, randomUUID } from 'node:crypto';
import type { Library } from '../src/model.ts';
import { parseLibrary } from '../src/model.ts';
import { starterLibrary } from '../src/seed.ts';

export interface Statement {
  bind(...values: (string | number | null)[]): Statement;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta: { changes: number } }>;
}
export interface AccountDatabase {
  prepare(sql: string): Statement;
  batch(statements: Statement[]): Promise<{ meta: { changes: number } }[]>;
}
export interface AccountSnapshot { user: { id: string }; revision: number; library: Library }
interface Row {
  id: string; profile_id: string; profile_hash: string; profile_chunks: number; revision: number;
  chunk_index: number | null; contents: string | null;
}
export class AccountError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
const digest = (text: string) => createHash('sha256').update(text).digest('hex');

function encode(library: Library) {
  const text = JSON.stringify(library);
  const chunks: string[] = [];
  for (let start = 0; start < text.length;) {
    let end = Math.min(start + 262144, text.length);
    if (end < text.length && /[\uD800-\uDBFF]/.test(text[end - 1])) end--;
    chunks.push(text.slice(start, end));
    start = end;
  }
  return { id: randomUUID(), hash: digest(text), chunks };
}

export function createAccountStore(db: AccountDatabase) {
  async function read(id: string): Promise<{ row: Row; snapshot: AccountSnapshot } | null> {
    // The revision and every chunk come from one SQL snapshot.
    const { results } = await db.prepare('SELECT a.*, p.chunk_index, p.contents FROM accounts a LEFT JOIN account_library_chunks p ON p.account_id = a.id AND p.profile_id = a.profile_id WHERE a.id = ? ORDER BY p.chunk_index').bind(id).all<Row>();
    const row = results[0];
    if (!row) return null;
    try {
      if (results.length !== row.profile_chunks || results.some((part, index) => part.chunk_index !== index || typeof part.contents !== 'string')) throw new Error();
      const text = results.map(part => part.contents).join('');
      if (digest(text) !== row.profile_hash) throw new Error();
      return { row, snapshot: { user: { id }, revision: row.revision, library: parseLibrary(text) } };
    } catch { throw new AccountError(503, 'Your saved library could not be read. It has been kept unchanged.'); }
  }

  function chunks(id: string, encoded: ReturnType<typeof encode>) {
    return encoded.chunks.map((contents, index) => db.prepare('INSERT INTO account_library_chunks (account_id, profile_id, chunk_index, contents) SELECT ?, ?, ?, ? WHERE EXISTS (SELECT 1 FROM accounts WHERE id = ? AND profile_id = ?)').bind(id, encoded.id, index, contents, id, encoded.id));
  }

  async function ensure(id: string): Promise<AccountSnapshot> {
    let current = await read(id);
    if (!current) {
      const encoded = encode(starterLibrary());
      await db.batch([
        db.prepare('INSERT OR IGNORE INTO accounts (id, profile_id, profile_hash, profile_chunks, revision) VALUES (?, ?, ?, ?, 0)').bind(id, encoded.id, encoded.hash, encoded.chunks.length),
        ...chunks(id, encoded),
      ]);
      current = await read(id);
    }
    if (!current) throw new AccountError(503, 'Account storage is unavailable. Try again shortly.');
    return current.snapshot;
  }

  async function save(id: string, revision: number, library: Library): Promise<number> {
    // Reading first also prevents replacing an unreadable or damaged library.
    const current = await read(id);
    if (!current || current.row.revision !== revision) throw new AccountError(409, 'Your library changed in another tab or device. Download your changes before loading the saved version.');
    const encoded = encode(library);
    const results = await db.batch([
      db.prepare("UPDATE accounts SET profile_id = ?, profile_hash = ?, profile_chunks = ?, revision = revision + 1, updated_at = datetime('now') WHERE id = ? AND revision = ? AND profile_id = ?").bind(encoded.id, encoded.hash, encoded.chunks.length, id, revision, current.row.profile_id),
      ...chunks(id, encoded),
      db.prepare('DELETE FROM account_library_chunks WHERE account_id = ? AND profile_id != ? AND EXISTS (SELECT 1 FROM accounts WHERE id = ? AND profile_id = ?)').bind(id, encoded.id, id, encoded.id),
    ]);
    if (!results[0].meta.changes) throw new AccountError(409, 'Your library changed in another tab or device. Download your changes before loading the saved version.');
    return revision + 1;
  }
  return { ensure, save };
}
