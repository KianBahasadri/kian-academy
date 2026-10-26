import { createPublicKey, createSign, generateKeyPairSync } from 'node:crypto';

export const keys = process.env.ACADEMY_TEST_SIGNING_KEY ? {
  privateKey: process.env.ACADEMY_TEST_SIGNING_KEY,
  publicKey: createPublicKey(process.env.ACADEMY_TEST_SIGNING_KEY).export({ type: 'spki', format: 'pem' }).toString(),
} : generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
export const issuer = 'https://test.clerk.accounts.dev';
export const testOrigin = 'https://academy.test';
const base64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');

export function tokenFor(userId = 'user_alice', overrides: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64({ alg: 'RS256', typ: 'JWT', kid: 'test-key' });
  const payload = base64({ sub: userId, sid: 'sess_test', iss: issuer, azp: testOrigin, iat: now - 10, nbf: now - 10, exp: now + 3600, ...overrides });
  const signature = createSign('RSA-SHA256').update(`${header}.${payload}`).sign(keys.privateKey, 'base64url');
  return `${header}.${payload}.${signature}`;
}
