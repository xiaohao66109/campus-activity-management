import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  timeout: 45000,
  reporter: [['list'], ['json', { outputFile: process.env.CAMPUS_TEST_URL ? 'docs/test-results/windows-browser-results.json' : 'docs/test-results/browser-results.json' }]],
  webServer: process.env.CAMPUS_TEST_URL ? undefined : { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true, timeout: 120000 },
  use: { baseURL: process.env.CAMPUS_TEST_URL || 'http://localhost:3000', channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure' },
});
