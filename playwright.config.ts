import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5174/taskflow-ai',
    trace: 'on-first-retry',
  },
  // webServer 已手动启动，使用 reuseExistingServer
  // 如需自动启动，取消下方注释
  // webServer: {
  //   command: 'npm run docs:dev',
  //   url: 'http://localhost:5173/taskflow-ai',
  //   reuseExistingServer: true,
  //   timeout: 120000,
  // },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
