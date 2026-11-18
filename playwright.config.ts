import { defineConfig } from '@playwright/test';

const port = Number(process.env.ACADEMY_TEST_PORT || 5175);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: process.env.CI ? 2 : undefined,
  use: {
    baseURL,
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium' },
    screenshot: 'only-on-failure',
  },
  webServer: { command: 'npm run dev', url: baseURL, env: { ACADEMY_PORT: String(port) } },
});
