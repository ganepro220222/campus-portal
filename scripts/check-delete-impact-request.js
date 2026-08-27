#!/usr/bin/env node
/** 删除影响预览：generation 校验 + impact 与 pending 一致才能确认 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const recycleView = path.join(root, 'admin/src/views/content/RecycleBinView.vue')
const memberView = path.join(root, 'admin/src/views/member/MemberListView.vue')
const tsUtil = path.join(root, 'admin/src/utils/deleteImpactRequest.ts')

const errs = []
const recycleSrc = fs.readFileSync(recycleView, 'utf8')
const memberSrc = fs.readFileSync(memberView, 'utf8')
const tsSrc = fs.readFileSync(tsUtil, 'utf8')

for (const [name, src] of [
  ['RecycleBinView', recycleSrc],
  ['MemberListView', memberSrc],
]) {
  if (!/impactRequestSeq|deleteImpactRequestSeq/.test(src)) {
    errs.push(`${name} 缺少影响预览 request seq`)
  }
  if (!/shouldApplyDeleteImpactResult/.test(src)) {
    errs.push(`${name} 未使用 shouldApplyDeleteImpactResult`)
  }
  if (!/deleteImpactMatchesPending/.test(src)) {
    errs.push(`${name} 未校验 impact 与 pending 一致`)
  }
  if (!/watch\(.*Visible/.test(src)) {
    errs.push(`${name} 弹窗关闭时未 watch 失效旧请求`)
  }
}

if (!/impactRequestSeq/.test(recycleSrc)) {
  errs.push('RecycleBinView 应使用 impactRequestSeq')
}
if (!/deleteImpactRequestSeq/.test(memberSrc)) {
  errs.push('MemberListView 应使用 deleteImpactRequestSeq')
}

if (!/shouldApplyDeleteImpactResult/.test(tsSrc)) {
  errs.push('deleteImpactRequest.ts 缺少 shouldApplyDeleteImpactResult')
}

if (errs.length) {
  console.error('check-delete-impact-request 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}
console.log('check-delete-impact-request OK')
