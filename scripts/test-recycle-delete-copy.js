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

const activityView = path.join(root, 'admin/src/views/activity/ActivityListView.vue')
const viewOriginal = fs.readFileSync(activityView, 'utf8')
if (!/取消后不可恢复/.test(viewOriginal)) {
  console.error('FAIL: ActivityListView onCancel 应保留「取消后不可恢复」')
  process.exit(1)
}
const badDelete = viewOriginal.replace(
  'softDeleteConfirm(`「${row.title}」`)',
  'softDeleteConfirm(`「${row.title}」此操作不可恢复`)'
)
if (badDelete === viewOriginal) {
  console.error('FAIL: 无法向 onDelete 注入「不可恢复」')
  process.exit(1)
}
fs.writeFileSync(activityView, badDelete)
try {
  execSync(`node "${script}"`, { stdio: 'pipe', cwd: root })
  console.error('FAIL: expected failure when onDelete says 不可恢复')
  process.exit(1)
} catch {
  // expected
} finally {
  fs.writeFileSync(activityView, viewOriginal)
}

run()
console.log('test-recycle-delete-copy: PASS')
