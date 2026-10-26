import { createPublicKey } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';

export async function checkClerk({ buildDirectory } = {}) {
  const hostname = process.env.ACADEMY_HOSTNAME;
  const publishableKey = process.env.VITE_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey?.startsWith('pk_live_')) throw new Error('Deployment requires a production Clerk publishable key.');
  const frontend = Buffer.from(publishableKey.slice(8), 'base64').toString('utf8');
  if (frontend !== `clerk.${hostname}$` || process.env.CLERK_ISSUER !== `https://clerk.${hostname}`) throw new Error('Clerk must belong to the Academy domain.');
  const key = createPublicKey(process.env.CLERK_JWT_KEY?.replace(/\\n/g, '\n'));
  if (key.asymmetricKeyType !== 'rsa') throw new Error('A Clerk RSA public key is required.');
  const response = await fetch(`https://clerk.${hostname}/.well-known/jwks.json`, { signal: AbortSignal.timeout(15000), redirect: 'error' });
  if (!response.ok) throw new Error('Clerk DNS and certificates must be ready before app deployment.');
  const jwks = await response.json();
  const expected = key.export({ type: 'spki', format: 'der' });
  if (!jwks.keys?.some(jwk => { try { return createPublicKey({ key: jwk, format: 'jwk' }).export({ type: 'spki', format: 'der' }).equals(expected); } catch { return false; } })) throw new Error('The Clerk verification key does not match this instance.');
  if (buildDirectory) {
    const files = (await readdir(`${buildDirectory}/assets`)).filter(name => name.endsWith('.js'));
    const scripts = await Promise.all(files.map(name => readFile(`${buildDirectory}/assets/${name}`, 'utf8')));
    if (!scripts.some(script => script.includes(publishableKey))) throw new Error('Build the frontend with the production Clerk key before deploying.');
    if (scripts.some(script => /sk_(live|test)_[a-zA-Z0-9]+/.test(script))) throw new Error('A Clerk secret key must never be present in a browser build.');
  }
}

if (import.meta.main) {
  try { process.loadEnvFile('.env'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  try { process.loadEnvFile('.env.production.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await checkClerk();
  console.log('Verified Clerk production domain and public key.');
}
