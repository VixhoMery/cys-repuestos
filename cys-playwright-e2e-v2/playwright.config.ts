import {
  defineConfig,
  devices,
} from '@playwright/test'

import dotenv from 'dotenv'
import path from 'node:path'


dotenv.config({
  path: path.resolve(
    process.cwd(),
    '.env.e2e',
  ),
})


export default defineConfig({
  testDir: './e2e',

  // Hay pruebas que crean y eliminan
  // un producto temporal.
  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,

  retries:
    process.env.CI ? 1 : 0,

  reporter: [
    ['list'],
    [
      'html',
      {
        open: 'never',
        outputFolder:
          'playwright-report',
      },
    ],
  ],

  use: {
    baseURL:
      process.env.E2E_BASE_URL ??
      'http://localhost:5173',

    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices[
          'Desktop Chrome'
        ],
      },
    },
  ],

  webServer: [
    {
      name: 'Backend',
      command:
        'pnpm -F backend dev',
      url:
        'http://localhost:3000/api/health',
      reuseExistingServer:
        !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      name: 'Frontend',
      command:
        'pnpm -F frontend dev --host localhost --port 5173',
      url:
        'http://localhost:5173/login',
      reuseExistingServer:
        !process.env.CI,
      timeout: 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
})
