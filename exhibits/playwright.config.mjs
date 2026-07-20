import { defineConfig } from '@playwright/test'

const PORT = process.env.PORT || '8199'
const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  timeout: isCI ? 120_000 : 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: isCI ? 1 : 2,
  retries: isCI ? 1 : 0,
  reporter: isCI ? 'github' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    viewport: { width: 900, height: 700 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    video: isCI ? 'retain-on-failure' : 'off',
  },
  webServer: {
    command: 'node _server/studio-server.mjs',
    url: `http://127.0.0.1:${PORT}/studio.html`,
    reuseExistingServer: !isCI,
    timeout: 30_000,
    env: { ...process.env, PORT: String(PORT) },
  },
})
