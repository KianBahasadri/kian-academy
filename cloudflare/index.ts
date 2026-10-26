import { json } from '../server/accountApi.ts';
import type { AccountGateway } from './accounts.ts';
export { AccountGateway } from './accounts.ts';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  ACCOUNTS: DurableObjectNamespace<AccountGateway>;
  ACCOUNTS_ORIGIN: string;
  CLERK_JWT_KEY: string;
  CLERK_ISSUER: string;
  RELEASE: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/account/')) return env.ACCOUNTS.getByName('accounts').fetch(request);
    if (path === '/api/health' && request.method === 'GET') return json({ status: 'ok', release: env.RELEASE });
    if (path.startsWith('/api/')) return json({ error: 'Endpoint not found.' }, 404);
    const response = await env.ASSETS.fetch(request);
    const secured = new Response(response.body, response);
    secured.headers.set('X-Content-Type-Options', 'nosniff');
    secured.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    secured.headers.set('X-Frame-Options', 'DENY');
    return secured;
  },
} satisfies ExportedHandler<Env>;
