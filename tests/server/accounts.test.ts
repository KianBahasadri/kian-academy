import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { localAccounts } from '../../server/localAccounts.ts';
import { createServer } from 'node:http';
import { accountSuite } from '../support/accountSuite.ts';
import { keys, issuer, testOrigin } from '../support/clerk.ts';

accountSuite('Local SQLite accounts', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'academy-accounts-'));
  const database = join(directory, 'accounts.sqlite');
  const api = localAccounts({ jwtKey: keys.publicKey, issuer, origins: [testOrigin] }, database);
  const server = createServer((req, res) => { void api.middleware(req, res, () => { res.statusCode = 404; res.end(); }); });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Account test server did not start.');
  return {
    request: (path, body, token, overrides = {}) => fetch(`http://127.0.0.1:${address.port}/api/account/${path}`, {
      method: body === undefined ? 'GET' : 'PUT',
      headers: { Origin: testOrigin, 'Content-Type': 'application/json', 'X-Academy-Request': '1', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...overrides },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    corrupt: async id => { const db = new DatabaseSync(database); db.prepare("UPDATE account_library_chunks SET contents = '{broken' WHERE account_id = ? AND chunk_index = 0").run(id); db.close(); },
    close: async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); api.close(); await rm(directory, { recursive: true, force: true }); },
  };
});
