import { createHash } from 'node:crypto';
import { cloudflare } from './cloudflare-api.mjs';

export async function r2Credentials() {
  const { AWS_ACCESS_KEY_ID: access, AWS_SECRET_ACCESS_KEY: secret } = process.env;
  if (access && secret) return { AWS_ACCESS_KEY_ID: access, AWS_SECRET_ACCESS_KEY: secret };
  if (access || secret || process.env.AWS_SESSION_TOKEN) throw new Error('Provide both R2 credentials, or leave both unset to derive them from the Cloudflare token.');
  const token = await cloudflare('/user/tokens/verify');
  if (token.status !== 'active' || !/^[a-f0-9]{32}$/.test(token.id)) throw new Error('An active Cloudflare token is required for private R2 state.');
  return { AWS_ACCESS_KEY_ID: token.id, AWS_SECRET_ACCESS_KEY: createHash('sha256').update(process.env.CLOUDFLARE_API_TOKEN).digest('hex') };
}
