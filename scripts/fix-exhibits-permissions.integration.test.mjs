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

/** Docker Hub 偶发 500 时用 ECR Public 镜像库作 fallback */
const IMAGE_CANDIDATES = (
  process.env.PERMISSIONS_TEST_IMAGE
    ? [process.env.PERMISSIONS_TEST_IMAGE]
    : [
        'debian:bookworm-slim',
        'public.ecr.aws/docker/library/debian:bookworm-slim',
      ]
)

function dockerAvailable() {
  const r = spawnSync('docker', ['info'], { encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'] })
  return r.status === 0
}

function sleep(ms) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    /* retry backoff */
  }
}

function dockerPull(image, attempts = 4) {
  let lastErr = ''
  for (let i = 1; i <= attempts; i++) {
    const r = spawnSync('docker', ['pull', image], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    if (r.status === 0) {
      return image
    }
    lastErr = (r.stderr || r.stdout || '').trim()
    if (i < attempts) {
      console.warn(`docker pull ${image} failed (attempt ${i}/${attempts}), retrying…`)
      sleep(i * 3000)
    }
  }
  throw new Error(`docker pull ${image} failed after ${attempts} attempts:\n${lastErr}`)
}

function resolveImage() {
  const errors = []
  for (const image of IMAGE_CANDIDATES) {
    try {
      return dockerPull(image)
    } catch (e) {
      errors.push(String(e.message || e))
    }
  }
  throw new Error(
    'Unable to pull any permissions-test image:\n' + errors.map((e) => `  - ${e.split('\n')[0]}`).join('\n'),
  )
}

function dockerRunIntegration(image) {
  return spawnSync(
    'docker',
    [
      'run',
      '--rm',
      '-v',
      `${repoRoot}:/repo:ro`,
      image,
      'bash',
      '/repo/scripts/fix-exhibits-permissions.integration.sh',
    ],
    { encoding: 'utf8', timeout: 300_000 },
  )
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

const image = resolveImage()
console.log(`fix-exhibits-permissions.integration: using ${image}`)

const r = dockerRunIntegration(image)
assert.equal(r.status, 0, r.stderr || r.stdout)
console.log('fix-exhibits-permissions.integration: PASS')
