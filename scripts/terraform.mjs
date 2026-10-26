import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { cloudflare, loadCredentials } from './cloudflare-api.mjs';
import { r2Credentials } from './r2-credentials.mjs';

process.umask(0o077);
const args = process.argv.slice(2);
if (!args.length) throw new Error('Usage: npm run infra -- init|validate|plan|apply|...');
const offline = ['fmt', 'validate', 'version', 'providers'].includes(args[0]);
if (!offline) {
  loadCredentials();
  try { process.loadEnvFile('.env.production.local'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!/^[a-f0-9]{32}$/.test(account ?? '')) throw new Error('Set CLOUDFLARE_ACCOUNT_ID.');
  Object.assign(process.env, await r2Credentials());
  if (args[0] === 'init' && !args.includes('-backend=false')) args.push(`-backend-config=endpoints={s3="https://${account}.r2.cloudflarestorage.com"}`);
  if (!['init', 'state', 'output', 'show', 'force-unlock'].includes(args[0])) {
    process.env.TF_VAR_account_id = account;
    process.env.TF_VAR_zone_id = process.env.CLOUDFLARE_ZONE_ID;
    process.env.TF_VAR_hostname = process.env.ACADEMY_HOSTNAME;
    process.env.TF_VAR_clerk_jwt_key = process.env.CLERK_JWT_KEY;
    process.env.TF_VAR_clerk_issuer = process.env.CLERK_ISSUER;
    const config = JSON.parse(await readFile('infra/cloudflare/clerk.json', 'utf8'));
    process.env.TF_VAR_clerk_cnames = JSON.stringify(config.cnames);
    const workers = await cloudflare(`/accounts/${account}/workers/scripts`);
    process.env.TF_VAR_worker_exists = String(workers.some(worker => worker.id === 'kian-academy'));
    const hash = createHash('sha256');
    for (const file of ['build/cloudflare/worker.js', 'dist/index.html']) hash.update(await readFile(file));
    process.env.TF_VAR_release = hash.digest('hex').slice(0, 16);
  }
}
await new Promise((resolve, reject) => {
  const child = spawn(process.env.TERRAFORM_BIN || 'terraform', ['-chdir=infra/cloudflare', ...args], { stdio: 'inherit', env: { ...process.env, TF_IN_AUTOMATION: '1' } });
  child.on('error', reject);
  child.on('exit', code => { process.exitCode = code ?? 1; if (code === 0 || code === 2 && args.includes('-detailed-exitcode')) resolve(); else reject(new Error(`Terraform exited with status ${code}.`)); });
});
