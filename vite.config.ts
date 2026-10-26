import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { localAccounts } from './server/localAccounts.ts';
import { clerkIssuer } from './server/accountApi.ts';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const port = Number(env.ACADEMY_PORT || 5174);
  function accounts() {
    return localAccounts({
      jwtKey: env.CLERK_JWT_KEY, secretKey: env.CLERK_SECRET_KEY,
      issuer: env.CLERK_ISSUER || clerkIssuer(env.VITE_CLERK_PUBLISHABLE_KEY),
      origins: env.ACCOUNTS_ORIGIN ? [env.ACCOUNTS_ORIGIN] : [`http://127.0.0.1:${port}`, `http://localhost:${port}`],
    }, env.ACCOUNTS_DATABASE);
  }
  return {
    plugins: [react(), {
      name: 'academy-accounts',
      configureServer(server) { const api = accounts(); server.middlewares.use(api.middleware); server.httpServer?.once('close', api.close); },
      configurePreviewServer(server) { const api = accounts(); server.middlewares.use(api.middleware); server.httpServer.once('close', api.close); },
    }],
    server: { port, strictPort: true, fs: { deny: ['.env', '.env.*', '**/.data/**', '**/.git/**', '**/*.sqlite*', '**/*.tfstate*', '**/*.tfplan'] } },
  };
});
