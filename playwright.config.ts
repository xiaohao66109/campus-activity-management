import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  timeout: 45000,
  reporter: [['list'], ['json', { outputFile: 'docs/test-results/browser-results.json' }]],
  webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: true, timeout: 120000 },
  use: { baseURL: 'http://localhost:3000', channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure' },
});
