import { defineConfig, devices } from '@playwright/test'

const PORT = Number(process.env.E2E_PORT ?? 3100)
// Use a pre-installed Chromium when available (e.g. CI images or sandboxes without downloads).
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    launchOptions: { executablePath },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions: { executablePath } } },
  ],
  webServer: [
    {
      // Test double for the Mollie API (e2e only).
      command: 'node e2e/mock-mollie.mjs',
      url: 'http://localhost:3199/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      command: `pnpm build && pnpm start -p ${PORT}`,
      url: `http://localhost:${PORT}`,
      reuseExistingServer: !process.env.CI,
      timeout: 240_000,
      env: {
        ENABLE_DEV_PAGES: '1',
        SAVESLOT_MEMORY_BACKEND: '1',
        E2E: '1',
        NEWS_FIXTURES: '1',
        CRON_SECRET: 'e2e-cron-secret-0123456789',
        // Shop/repairs open with clearly-marked TEST details (refused on Vercel production).
        SHOP_TEST_MODE: '1',
        MOLLIE_API_KEY: 'test_e2e_mock_mollie_key_000000',
        MOLLIE_API_BASE: 'http://localhost:3199/v2',
        ADMIN_EMAILS: 'admin@example.test',
      },
    },
  ],
})
