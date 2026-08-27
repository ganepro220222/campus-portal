#!/usr/bin/env node
/** check-recycle-delete-copy 双向验证 */
const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')

const root = path.resolve(__dirname, '..')
const script = path.join(__dirname, 'check-recycle-delete-copy.js')
const target = path.join(root, 'admin/src/utils/recycleBinCopy.ts')

function run() {
  execSync(`node "${script}"`, { stdio: 'pipe', cwd: root })
}

run()

const original = fs.readFileSync(target, 'utf8')
const bad = original.replace(/回收站/g, '垃圾箱')
fs.writeFileSync(target, bad)
try {
  execSync(`node "${script}"`, { stdio: 'pipe', cwd: root })
  console.error('FAIL: expected failure when 回收站 removed from recycleBinCopy.ts')
  process.exit(1)
} catch {
  // expected
} finally {
  fs.writeFileSync(target, original)
}

run()
console.log('test-recycle-delete-copy: PASS')
