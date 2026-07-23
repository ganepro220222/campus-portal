import { defineConfig } from '@playwright/test'

const PORT = process.env.PORT || '8199'
const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  timeout: isCI ? 120_000 : 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  // 3D/WebGL 用例并行时 Windows 上 context 关闭与 trace 写入易超时；CI 已是 1 worker
  workers: process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : 1,
  retries: isCI ? 1 : 0,
  reporter: isCI ? 'github' : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    viewport: { width: 900, height: 700 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: process.env.PW_TRACE === 'on' ? 'retain-on-failure' : (isCI ? 'retain-on-failure' : 'off'),
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
