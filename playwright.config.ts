import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir:    './tests/e2e',
  timeout:    30_000,
  retries:    1,
  reporter:   'html',
  use: {
    baseURL:       'http://localhost:3000',
    trace:         'on-first-retry',
    screenshot:    'only-on-failure',
    video:         'retain-on-failure',
  },
  projects: [
    {
      name:  'chromium',
      use:   { ...devices['Desktop Chrome'] },
    },
  ],
  // Start the Next.js dev server automatically when running e2e tests
  webServer: {
    command:           'npm run dev',
    url:               'http://localhost:3000',
    reuseExistingServer: true,
    timeout:           120_000,
  },
});
