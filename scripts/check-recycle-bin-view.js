#!/usr/bin/env node
/** 回收站：列表竞态防护 + 操作必须使用 row.type / pendingType */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const view = path.join(root, 'admin/src/views/content/RecycleBinView.vue')
const tsUtil = path.join(root, 'admin/src/utils/recycleBinListRequest.ts')
const jsUtil = path.join(root, 'scripts/lib/recycleBinListRequest.js')

const src = fs.readFileSync(view, 'utf8')
const tsSrc = fs.readFileSync(tsUtil, 'utf8')
const jsSrc = fs.readFileSync(jsUtil, 'utf8')
const errs = []

if (!/shouldApplyRecycleListResult/.test(src)) {
  errs.push('RecycleBinView 未使用 shouldApplyRecycleListResult')
}
if (!/listRequestSeq/.test(src)) {
  errs.push('RecycleBinView 缺少 listRequestSeq')
}
if (!/restoreRecycleItem\(row\.type/.test(src)) {
  errs.push('RecycleBinView 恢复须使用 row.type')
}
if (!/fetchRecycleImpact\((row\.type|type)/.test(src)) {
  errs.push('RecycleBinView 影响预览须使用 row.type')
}
if (!/pendingType/.test(src) || !/purgeRecycleItem\(pendingType/.test(src)) {
  errs.push('RecycleBinView 彻底删除须固定 pendingType')
}
if (!/restoreRecycleItem\(activeType/.test(src)) {
  // ok - should NOT use activeType for restore
} else {
  errs.push('RecycleBinView 恢复仍使用 activeType')
}
if (/fetchRecycleImpact\(activeType/.test(src)) {
  errs.push('RecycleBinView 影响预览仍使用 activeType')
}
if (!/purgeCanProceed/.test(src) || !/deleteImpactMatchesPending/.test(src)) {
  errs.push('RecycleBinView 确认删除须校验 impact 与 pending 一致')
}
if (!/items\.value = \[\]/.test(src)) {
  errs.push('RecycleBinView 切换类型时应清空 items')
}

for (const marker of ['shouldApplyRecycleListResult', 'requestedType === currentType']) {
  if (!tsSrc.includes(marker) || !jsSrc.includes('latestSeq')) {
    errs.push(`recycleBinListRequest TS/JS 不同步：缺少 ${marker}`)
  }
}

if (errs.length) {
  console.error('check-recycle-bin-view 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}
console.log('check-recycle-bin-view OK')
