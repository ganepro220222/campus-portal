#!/usr/bin/env node
/** Run staging-backend-health.test.sh when bash is available. */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const script = path.join(ROOT, 'scripts/staging-backend-health.test.sh')

function resolveBash() {
  if (process.platform !== 'win32') return 'bash'
  const candidates = [
    process.env.BASH_PATH,
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
  ].filter(Boolean)
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }
  return null
}

const bash = resolveBash()
if (!bash) {
  console.log('staging-backend-health.test: SKIP (bash not found)')
  process.exit(0)
}

const result = spawnSync(bash, [script], {
  cwd: ROOT,
  encoding: 'utf8',
  env: process.env,
})

if (result.stdout) process.stdout.write(result.stdout)
if (result.stderr) process.stderr.write(result.stderr)
assert.equal(result.status, 0, 'staging-backend-health.test.sh failed')

console.log('staging-backend-health.test: PASS')
