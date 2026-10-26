import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { loadCredentials } from './cloudflare-api.mjs';
import { checkClerk } from './check-clerk.mjs';
import { assertSafePlan, assertExistingState } from './deployment-checks.mjs';

process.umask(0o077);
loadCredentials();
try { process.loadEnvFile('.env.production.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
await checkClerk({ buildDirectory: 'dist' });
await mkdir('.data/terraform-backups', { recursive: true, mode: 0o700 });

async function infra(args, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/terraform.mjs', ...args], { env: process.env, stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit' });
    let output = '';
    child.stdout?.on('data', chunk => { output += chunk; });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve(output) : reject(new Error(`Infrastructure command failed (${code}).`)));
  });
}

await infra(['init', '-input=false']);
const beforeText = await infra(['state', 'pull'], true);
const before = JSON.parse(beforeText);
const initial = process.argv.includes('--initial');
let identity;
try { identity = JSON.parse(await readFile('infra/cloudflare/production.json', 'utf8')); }
catch (error) { if (error.code !== 'ENOENT') throw error; if (!initial) throw new Error('Production identity is missing. First deployment requires --initial after reviewing the new infrastructure.'); }
if (identity) {
  if (before.lineage !== identity.lineage) throw new Error('Production state lineage changed. Restore or import state before deploying.');
  assertExistingState(before, identity.resources);
} else if (before.resources?.some(resource => !['cloudflare_r2_bucket', 'cloudflare_r2_managed_domain', 'cloudflare_dns_record'].includes(resource.type))) {
  throw new Error('Initial deployment found existing application resources. Record their identities before deploying.');
}
await writeFile(`.data/terraform-backups/${new Date().toISOString().replaceAll(':', '-')}.tfstate`, beforeText, { mode: 0o600 });
const planPath = resolve('.data/deploy.tfplan');
await infra(['plan', '-input=false', `-out=${planPath}`]);
const plan = JSON.parse(await infra(['show', '-json', planPath], true));
assertSafePlan(plan);
console.log('Reviewed plan: no infrastructure deletion or replacement.');
await infra(['apply', '-input=false', planPath]);
const after = JSON.parse(await infra(['state', 'pull'], true));
const tracked = ['cloudflare_d1_database.accounts', 'cloudflare_workers_script.app', 'cloudflare_workers_route.primary', 'cloudflare_r2_bucket.terraform'];
const resources = Object.fromEntries(tracked.map(address => {
  const resource = after.resources?.find(item => `${item.type}.${item.name}` === address);
  if (!resource?.instances?.[0]?.attributes?.id) throw new Error(`Deployed state is missing ${address}.`);
  return [address, resource.instances[0].attributes.id];
}));
await writeFile('infra/cloudflare/production.json', JSON.stringify({ hostname: process.env.ACADEMY_HOSTNAME, account_id: process.env.CLOUDFLARE_ACCOUNT_ID, lineage: after.lineage, resources }, null, 2) + '\n');

const hash = createHash('sha256');
for (const path of ['build/cloudflare/worker.js', 'dist/index.html']) hash.update(await readFile(path));
const release = hash.digest('hex').slice(0, 16);
const origin = `https://${process.env.ACADEMY_HOSTNAME}`;
let failure;
for (let attempt = 0; attempt < 4; attempt++) {
  try {
    const health = await fetch(`${origin}/api/health?release=${release}`, { signal: AbortSignal.timeout(15000) });
    const status = await health.json();
    if (!health.ok || status.release !== release) throw new Error('The new Worker release is not live yet.');
    const session = await fetch(`${origin}/api/account/session`, { signal: AbortSignal.timeout(15000) });
    if (!session.ok || (await session.json()).user !== null || !session.headers.get('cache-control')?.includes('no-store')) throw new Error('Guest account endpoint verification failed.');
    const frontend = await fetch(`${origin}/`, { signal: AbortSignal.timeout(15000) });
    if (!frontend.ok || !(await frontend.text()).includes('Kian Academy')) throw new Error('Frontend verification failed.');
    console.log(`Deployed and verified ${origin} (release ${release}).`);
    failure = null; break;
  } catch (error) { failure = error; if (attempt < 3) { console.log('Waiting for the release to propagate…'); await new Promise(resolve => setTimeout(resolve, 8000)); } }
}
if (failure) throw failure;
