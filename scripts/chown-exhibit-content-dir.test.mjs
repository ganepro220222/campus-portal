#!/usr/bin/env node
/** Run chown-exhibit-content-dir.test.sh when bash is available. */
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const script = path.join(ROOT, 'scripts/chown-exhibit-content-dir.test.sh')
const helper = path.join(ROOT, 'scripts/chown-exhibit-content-dir.sh')

function bashAvailable() {
  const names = process.platform === 'win32' ? ['bash', 'C:\\Program Files\\Git\\bin\\bash.exe'] : ['bash']
  for (const cmd of names) {
    const r = spawnSync(cmd, ['--version'], { encoding: 'utf8' })
    if (r.status === 0) return cmd
  }
  return null
}

const helperText = fs.readFileSync(helper, 'utf8')
assert.match(helperText, /必须以 root 运行/)
assert.match(helperText, /共享背景/)
assert.match(helperText, /exhibits-chown-root/)
assert.doesNotMatch(helperText, /chown\s+-R/)
assert.doesNotMatch(helperText, /chmod\s+-R/)

const bash = bashAvailable()
if (!bash) {
  if (process.env.CI) {
    console.error('chown-exhibit-content-dir.test: CI requires bash')
    process.exit(1)
  }
  console.log('chown-exhibit-content-dir.test: SKIP (bash not found)')
  process.exit(0)
}

assert.ok(fs.existsSync(script), 'missing chown-exhibit-content-dir.test.sh')
const result = spawnSync(bash, [script], { encoding: 'utf8', cwd: ROOT })
if (result.status !== 0) {
  console.error(result.stdout)
  console.error(result.stderr)
}
assert.equal(result.status, 0, 'chown-exhibit-content-dir.test.sh failed')
console.log('chown-exhibit-content-dir.test: PASS')
