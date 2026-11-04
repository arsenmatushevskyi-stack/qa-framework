import { defineConfig } from '@playwright/test';

// Fixture only: no browser project and no baseURL. Never used for browser tests.
export default defineConfig({
  testDir: '.',
  testMatch: 'run-if-env.spec.ts',
  retries: 0,
  workers: 1,
});
