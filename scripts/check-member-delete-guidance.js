#!/usr/bin/env node
/**
 * 师生账号删除弹窗：canAnonymize 必须被消费，终态文案不得误导。
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const memberView = path.join(root, 'admin/src/views/member/MemberListView.vue')
const guidanceTs = path.join(root, 'admin/src/utils/memberDeleteGuidance.ts')
const guidanceJs = path.join(root, 'scripts/lib/memberDeleteGuidance.js')
const dialogVue = path.join(root, 'admin/src/components/DangerDeleteDialog.vue')

const errs = []

const viewSrc = fs.readFileSync(memberView, 'utf8')
const guidanceSrc = fs.readFileSync(guidanceTs, 'utf8')
const guidanceJsSrc = fs.readFileSync(guidanceJs, 'utf8')
const dialogSrc = fs.readFileSync(dialogVue, 'utf8')

const SYNC_MARKERS = [
  '暂时不能删除',
  '账号已完成清退',
  '请改用「清退」',
  '无需继续操作',
]
for (const marker of SYNC_MARKERS) {
  if (!guidanceSrc.includes(marker) || !guidanceJsSrc.includes(marker)) {
    errs.push(`memberDeleteGuidance TS/JS 文案不同步：缺少「${marker}」`)
  }
}

if (!/@\/utils\/memberDeleteGuidance/.test(viewSrc)) {
  errs.push('MemberListView 未 import memberDeleteGuidance')
}
if (!/memberDeleteGuidance\s*\(/.test(viewSrc)) {
  errs.push('MemberListView 未调用 memberDeleteGuidance()')
}
if (!/:blocked-title=/.test(viewSrc) || !/:blocked-description=/.test(viewSrc)) {
  errs.push('MemberListView 未向 DangerDeleteDialog 传入 blocked-title / blocked-description')
}
if (/请改用「清退」/.test(viewSrc)) {
  errs.push('MemberListView 仍硬编码「请改用清退」——应集中在 memberDeleteGuidance.ts')
}

if (!/canAnonymize/.test(guidanceSrc)) {
  errs.push('memberDeleteGuidance.ts 未使用 canAnonymize')
}
if (!/账号已完成清退/.test(guidanceSrc)) {
  errs.push('memberDeleteGuidance.ts 缺少已清退终态文案')
}
if (/再回来删除/.test(guidanceSrc.split('TERMINAL')[1] ?? '')) {
  errs.push('memberDeleteGuidance 终态文案误含「再回来删除」')
}

if (!/blockedTitle\?:/.test(dialogSrc) && !/blockedTitle:/.test(dialogSrc)) {
  errs.push('DangerDeleteDialog 缺少 blockedTitle prop')
}
if (!/blockedDescription\?:/.test(dialogSrc) && !/blockedDescription:/.test(dialogSrc)) {
  errs.push('DangerDeleteDialog 缺少 blockedDescription prop')
}

if (errs.length) {
  console.error('check-member-delete-guidance 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}

console.log('check-member-delete-guidance OK')
