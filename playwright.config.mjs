import { defineConfig } from 'playwright/test';
import { cp, mkdir } from 'node:fs/promises';

const subpathRoot = new URL('./.work/hosting/stegarena-page/', import.meta.url);
await mkdir(subpathRoot, { recursive: true });
await cp(new URL('./dist/', import.meta.url), subpathRoot, { recursive: true });

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  outputDir: '.work/test-results',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: process.platform === 'darwin' ? 'chrome' : undefined,
    headless: true,
    screenshot: 'off',
    trace: 'off',
    video: 'off'
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }
  ],
  webServer: [
    {
      command: 'npm run preview',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: true,
      timeout: 30000
    },
    {
      command: 'node node_modules/serve/build/main.js .work/hosting -l tcp://127.0.0.1:4174',
      url: 'http://127.0.0.1:4174/stegarena-page/',
      reuseExistingServer: false,
      timeout: 30000
    }
  ]
});
