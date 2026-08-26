#!/usr/bin/env node
/** Run staging-studio-rollback.test.sh when bash is available. */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const script = path.join(ROOT, 'scripts/staging-studio-rollback.test.sh')

function bashAvailable() {
  const names = process.platform === 'win32' ? ['bash', 'C:\\Program Files\\Git\\bin\\bash.exe'] : ['bash']
  for (const cmd of names) {
    const r = spawnSync(cmd, ['--version'], { encoding: 'utf8' })
    if (r.status === 0) return cmd
  }
  return null
}

const bash = bashAvailable()
if (!bash) {
  if (process.env.CI) {
    console.error('staging-studio-rollback.test: CI requires bash')
    process.exit(1)
  }
  console.log('staging-studio-rollback.test: SKIP (bash not found)')
  process.exit(0)
}

assert.ok(fs.existsSync(script), 'missing staging-studio-rollback.test.sh')
const result = spawnSync(bash, [script], { encoding: 'utf8', cwd: ROOT })
if (result.status !== 0) {
  console.error(result.stdout)
  console.error(result.stderr)
}
assert.equal(result.status, 0, 'staging-studio-rollback.test.sh failed')

console.log('staging-studio-rollback.test: PASS')
