import { DurableObject } from 'cloudflare:workers';
import { createAccountApi } from '../server/accountApi.ts';
import type { Env } from './index.ts';

// D1 owns the records. This coordinator gives large essay saves enough CPU time.
export class AccountGateway extends DurableObject<Env> {
  fetch(request: Request) {
    return createAccountApi(this.env.DB, { jwtKey: this.env.CLERK_JWT_KEY, issuer: this.env.CLERK_ISSUER, origins: [this.env.ACCOUNTS_ORIGIN] })(request);
  }
}
