#!/usr/bin/env node
const path = require('node:path')
const { spawnSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const testFile = path.join(root, 'admin/src/utils/memberDeleteGuidance.test.ts')

const r = spawnSync(process.execPath, ['--experimental-strip-types', testFile], {
  cwd: root,
  encoding: 'utf8',
})

if (r.status !== 0) {
  const out = ((r.stdout || '') + (r.stderr || '')).trimEnd()
  if (out) console.error(out)
  process.exit(r.status ?? 1)
}

if (r.stdout) process.stdout.write(r.stdout)

const { execSync } = require('node:child_process')
execSync(`node "${path.join(__dirname, 'check-member-delete-guidance.js')}"`, { stdio: 'inherit', cwd: root })
console.log('test-member-delete-guidance: PASS')
