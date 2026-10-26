import { verifyToken } from '@clerk/backend';
import { parseLibrary } from '../src/model.ts';
import { AccountError, createAccountStore } from './accountStore.ts';
import type { AccountDatabase } from './accountStore.ts';

export interface AccountConfig {
  jwtKey?: string;
  secretKey?: string;
  issuer?: string;
  origins: string[];
}
export const MAX_SAVE_BYTES = 10 * 1024 * 1024;

export function clerkIssuer(publishableKey?: string): string | undefined {
  if (!publishableKey || !/^pk_(test|live)_/.test(publishableKey)) return;
  try {
    const host = Buffer.from(publishableKey.replace(/^pk_(test|live)_/, ''), 'base64').toString('utf8').replace(/\$$/, '');
    if (!/^[a-z0-9.-]+$/i.test(host) || !host.includes('.')) return;
    return `https://${host}`;
  } catch { return; }
}

export function json(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') throw new AccountError(415, 'Send JSON data.');
  if (Number(request.headers.get('Content-Length')) > MAX_SAVE_BYTES) throw new AccountError(413, 'This library exceeds the 10 MB save limit. Download a backup to keep your changes.');
  const reader = request.body?.getReader();
  if (!reader) throw new AccountError(400, 'The request is empty.');
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => { void reader.cancel(); reject(new AccountError(408, 'The save timed out. Try again.')); }, 15000); });
  try {
    while (true) {
      const { value, done } = await Promise.race([reader.read(), timeout]);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_SAVE_BYTES) throw new AccountError(413, 'This library exceeds the 10 MB save limit. Download a backup to keep your changes.');
      chunks.push(value);
    }
  } finally { clearTimeout(timer); await reader.cancel().catch(() => {}); }
  try {
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value as Record<string, unknown>;
  } catch { throw new AccountError(400, 'The request could not be read.'); }
}

export function createAccountApi(database: AccountDatabase, config: AccountConfig) {
  const store = createAccountStore(database);

  async function identity(request: Request, required: boolean): Promise<string | null> {
    const authorization = request.headers.get('Authorization');
    if (!authorization) {
      if (required) throw new AccountError(401, 'Sign in to save your library.');
      return null;
    }
    const token = /^Bearer (\S+)$/i.exec(authorization)?.[1];
    if (!token || token.length > 8192) throw new AccountError(401, 'Your session expired. Sign in again.');
    if (!config.jwtKey && !config.secretKey) throw new AccountError(503, 'Account sign-in is not configured.');
    try {
      const payload = await verifyToken(token, {
        ...(config.jwtKey ? { jwtKey: config.jwtKey.replace(/\\n/g, '\n') } : {}),
        ...(config.secretKey ? { secretKey: config.secretKey } : {}),
        ...(config.issuer ? { issuer: config.issuer } : {}),
        authorizedParties: config.origins,
      });
      if (!payload.sub?.startsWith('user_') || payload.sub.length > 128 || typeof payload.sid !== 'string' || !config.origins.includes(payload.azp ?? '')) throw new Error();
      return payload.sub;
    } catch { throw new AccountError(401, 'Your session expired. Sign in again.'); }
  }

  return async function accountApi(request: Request): Promise<Response> {
    try {
      const path = new URL(request.url).pathname;
      if (path === '/api/account/session') {
        if (request.method !== 'GET') throw new AccountError(405, 'Method not allowed.');
        const userId = await identity(request, false);
        return json(userId ? await store.ensure(userId) : { user: null });
      }
      if (path !== '/api/account/profile') throw new AccountError(404, 'Account endpoint not found.');
      if (request.method !== 'PUT') throw new AccountError(405, 'Method not allowed.');
      if (!config.origins.includes(request.headers.get('Origin') ?? '') || request.headers.get('X-Academy-Request') !== '1' || request.headers.get('Sec-Fetch-Site') === 'cross-site') throw new AccountError(403, 'Open Kian Academy directly to save changes.');
      const userId = (await identity(request, true))!;
      const value = await readBody(request);
      if (value.accountId !== userId) throw new AccountError(409, 'The signed-in account changed. Reload your account before saving.');
      if (!Number.isSafeInteger(value.revision) || Number(value.revision) < 0) throw new AccountError(400, 'Invalid save revision.');
      let library;
      try { library = parseLibrary(JSON.stringify(value.library)); }
      catch { throw new AccountError(400, 'This library is not valid. Your saved library has been kept unchanged.'); }
      return json({ revision: await store.save(userId, Number(value.revision), library) });
    } catch (error) {
      return json({ error: error instanceof AccountError ? error.message : 'Account storage is temporarily unavailable. Try again shortly.' }, error instanceof AccountError ? error.status : 503);
    }
  };
}
