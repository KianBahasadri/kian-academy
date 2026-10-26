import { defineConfig } from '@playwright/test';
import { keys, issuer } from './tests/support/clerk.ts';

process.env.ACADEMY_TEST_SIGNING_KEY = keys.privateKey;
const port = Number(process.env.ACADEMY_TEST_PORT || 5175);

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  timeout: 30000,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: 'chromium',
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' },
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --mode test', url: `http://127.0.0.1:${port}`, reuseExistingServer: false,
    env: { ACADEMY_PORT: String(port), VITE_CLERK_PUBLISHABLE_KEY: '', CLERK_JWT_KEY: keys.publicKey, CLERK_SECRET_KEY: '', CLERK_ISSUER: issuer, ACCOUNTS_DATABASE: `.data/browser-tests-${process.pid}.sqlite` },
  },
});
