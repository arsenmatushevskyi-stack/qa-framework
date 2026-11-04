import { defineConfig, devices } from '@playwright/test';
import { getTarget } from './env/target.ts';

export default defineConfig({
  testDir: 'tests',
  retries: 0,
  use: {
    baseURL: getTarget().baseURL,
    testIdAttribute: 'data-testid',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
