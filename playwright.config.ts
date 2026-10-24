import { defineConfig, devices } from '@playwright/test'

const baseURL = 'http://localhost:4173'

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL },
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'iphone', use: { ...devices['iPhone 15'] } }
  ]
})
