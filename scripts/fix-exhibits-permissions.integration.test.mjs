#!/usr/bin/env node
/** fix-exhibits-permissions Docker 集成测试（CI 必须提供 Docker） */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(dir, '..')
const integrationSh = path.join(dir, 'fix-exhibits-permissions.integration.sh')

function dockerAvailable() {
  const r = spawnSync('docker', ['info'], { encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'] })
  return r.status === 0
}

if (process.platform === 'win32') {
  if (process.env.CI) {
    console.error('fix-exhibits-permissions.integration: CI on win32 is unsupported')
    process.exit(1)
  }
  console.log('fix-exhibits-permissions.integration: skip (win32)')
  process.exit(0)
}

if (!dockerAvailable()) {
  const msg = 'fix-exhibits-permissions.integration: Docker required for permissions integration test'
  if (process.env.CI) {
    console.error(msg)
    process.exit(1)
  }
  console.log(`${msg} (local skip)`)
  process.exit(0)
}

assert.ok(fs.existsSync(integrationSh), 'missing fix-exhibits-permissions.integration.sh')

const r = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '-v',
    `${repoRoot}:/repo:ro`,
    'debian:bookworm-slim',
    'bash',
    '/repo/scripts/fix-exhibits-permissions.integration.sh',
  ],
  { encoding: 'utf8', timeout: 300_000 },
)
assert.equal(r.status, 0, r.stderr || r.stdout)
console.log('fix-exhibits-permissions.integration: PASS')
