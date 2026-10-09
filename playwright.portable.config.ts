import { defineConfig } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

process.env.PORTABLE_APP_URL = pathToFileURL(resolve('打开校园活动系统.html')).href;

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  timeout: 45000,
  reporter: [['list'], ['json', { outputFile: 'docs/test-results/portable-browser-results.json' }]],
  projects: [
    { name: 'edge', use: { browserName: 'chromium', channel: 'msedge' } },
    ...(process.env.PORTABLE_TEST_FIREFOX === '1'
      ? [{ name: 'firefox', use: { browserName: 'firefox' as const } }]
      : []),
    // WebKit on Windows treats file:// navigation as a network operation when
    // offline=true. Tests also intercept all HTTP requests before navigation.
    { name: 'webkit', use: { browserName: 'webkit', offline: false } },
  ],
  use: {
    offline: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: 'only-on-failure',
  },
});
