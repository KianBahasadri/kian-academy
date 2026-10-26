import { readFile, readdir } from 'node:fs/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { accountSuite } from '../support/accountSuite.ts';
import { keys, issuer, testOrigin } from '../support/clerk.ts';

accountSuite('Cloudflare Worker and D1 accounts', async () => {
  const options = convertV4MiniflareOptions({
    name: 'kian-academy', modules: true, scriptPath: 'build/cloudflare/worker.js',
    compatibilityDate: '2026-10-01', compatibilityFlags: ['nodejs_compat'],
    bindings: { ACCOUNTS_ORIGIN: testOrigin, CLERK_JWT_KEY: keys.publicKey, CLERK_ISSUER: issuer, RELEASE: 'test' },
    d1Databases: ['DB'], durableObjects: { ACCOUNTS: { className: 'AccountGateway', useSQLite: true } },
  });
  const mf = new Miniflare(options);
  const db = await mf.getD1Database('DB');
  for (const filename of (await readdir('cloudflare/migrations')).filter(name => name.endsWith('.sql')).sort()) await db.exec((await readFile(`cloudflare/migrations/${filename}`, 'utf8')).replace(/\n/g, ' '));
  return {
    request: (path, body, token, overrides = {}) => mf.dispatchFetch(`${testOrigin}/api/account/${path}`, {
      method: body === undefined ? 'GET' : 'PUT',
      headers: { Origin: testOrigin, 'Content-Type': 'application/json', 'X-Academy-Request': '1', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...overrides },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
    corrupt: async id => { await db.prepare("UPDATE account_library_chunks SET contents = '{broken' WHERE account_id = ? AND chunk_index = 0").bind(id).run(); },
    close: () => mf.dispose(),
  };
});
