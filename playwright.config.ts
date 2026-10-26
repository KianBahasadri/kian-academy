import { defineConfig } from '@playwright/test';

const port = Number(process.env.ACADEMY_TEST_PORT || 5175);
export default defineConfig({
  testDir: './tests', testMatch: '**/*.spec.ts', fullyParallel: true, timeout: 30000, workers: process.env.CI ? 2 : undefined,
  use: { baseURL: `http://127.0.0.1:${port}`, browserName: 'chromium', launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' }, screenshot: 'only-on-failure' },
  webServer: { command: 'npm run dev', url: `http://127.0.0.1:${port}`, reuseExistingServer: false, env: { ACADEMY_PORT: String(port) } },
});
