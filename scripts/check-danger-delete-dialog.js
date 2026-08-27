#!/usr/bin/env node
/** 危险删除弹窗：提交中锁定关闭入口 + 回收站刷新可访问名称 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const dialog = path.join(root, 'admin/src/components/DangerDeleteDialog.vue')
const recycleView = path.join(root, 'admin/src/views/content/RecycleBinView.vue')
const tsUtil = path.join(root, 'admin/src/utils/dangerDeleteDialogSubmitLock.ts')

const dialogSrc = fs.readFileSync(dialog, 'utf8')
const recycleSrc = fs.readFileSync(recycleView, 'utf8')
const tsSrc = fs.readFileSync(tsUtil, 'utf8')
const errs = []

if (!/shouldAllowDangerDeleteDialogClose/.test(dialogSrc)) {
  errs.push('DangerDeleteDialog 未使用 shouldAllowDangerDeleteDialogClose')
}
if (!/:show-close="!submitting"/.test(dialogSrc)) {
  errs.push('DangerDeleteDialog 缺少 :show-close="!submitting"')
}
if (!/:close-on-click-modal="!submitting"/.test(dialogSrc)) {
  errs.push('DangerDeleteDialog 缺少 :close-on-click-modal="!submitting"')
}
if (!/:close-on-press-escape="!submitting"/.test(dialogSrc)) {
  errs.push('DangerDeleteDialog 缺少 :close-on-press-escape="!submitting"')
}
if (!/:before-close="beforeClose"/.test(dialogSrc)) {
  errs.push('DangerDeleteDialog 缺少 before-close 守卫')
}
if (!/:disabled="submitting"/.test(dialogSrc) || !/取消/.test(dialogSrc)) {
  errs.push('DangerDeleteDialog 取消按钮须在 submitting 时禁用')
}
if (!/正在彻底删除/.test(dialogSrc)) {
  errs.push('DangerDeleteDialog 提交中应提示勿关闭')
}

if (!/shouldAllowDangerDeleteDialogClose/.test(tsSrc)) {
  errs.push('dangerDeleteDialogSubmitLock.ts 缺少 shouldAllowDangerDeleteDialogClose')
}

if (!/aria-label="刷新回收站"|>刷新</.test(recycleSrc)) {
  errs.push('RecycleBinView 刷新按钮须有可见文字或 aria-label')
}

if (errs.length) {
  console.error('check-danger-delete-dialog 失败：')
  for (const e of errs) console.error('  ✖ ' + e)
  process.exit(1)
}
console.log('check-danger-delete-dialog OK')
