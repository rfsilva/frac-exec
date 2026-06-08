import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 1,
  reporter: [
    ['html', { outputFolder: '../../../bmad-output/test-artifacts/e2e-reports', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:80',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Extra settings for API testing within E2E
  globalSetup: './setup/global-setup.ts',
});
