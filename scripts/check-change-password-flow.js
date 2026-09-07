#!/usr/bin/env node
/**
 * 改密页须共用 changePasswordFlow.js，避免页面内联副本与单测工具漂移。
 * 用法：node scripts/check-change-password-flow.js
 */
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const pageJs = fs.readFileSync(
  path.join(root, 'miniapp/packageC/profile/change-password/index.js'),
  'utf8'
)
const flowJs = fs.readFileSync(path.join(root, 'miniapp/utils/changePasswordFlow.js'), 'utf8')
const loginJs = fs.readFileSync(path.join(root, 'miniapp/pages/login/index.js'), 'utf8')
const loginWxml = fs.readFileSync(path.join(root, 'miniapp/pages/login/index.wxml'), 'utf8')

const errs = []

if (!pageJs.includes("require('../../../utils/changePasswordFlow')")
    && !pageJs.includes('require("../../../utils/changePasswordFlow")')) {
  errs.push('改密页未 require changePasswordFlow.js')
}

for (const fn of [
  'shouldApplyChangePasswordSuccess',
  'changePassword401PageAction',
  'canLogoutDuringChangePassword',
  'resolveChangePasswordMode',
  'buildChangePasswordPayload'
]) {
  if (!pageJs.includes(fn)) {
    errs.push(`改密页未调用 changePasswordFlow.${fn}`)
  }
}

if (pageJs.includes('setTimeout(() => getApp().logout()')) {
  errs.push('改密页 catch 不应再 setTimeout logout（401 由 request 层处理）')
}

if (!flowJs.includes('module.exports')) {
  errs.push('changePasswordFlow.js 缺少 module.exports')
}

if (loginJs.includes('_enterChangePasswordMode') || loginJs.includes('changePasswordMode')) {
  errs.push('登录页不得再保留内嵌改密 changePasswordMode / _enterChangePasswordMode')
}
if (loginJs.includes("mode === 'changePassword'") || loginJs.includes('mode === "changePassword"')) {
  errs.push('登录页不得再保留不可达的 ?mode=changePassword 分支')
}
if (loginWxml.includes('changePasswordMode') || loginWxml.includes('bindtap="onChangePassword"')) {
  errs.push('登录页 WXML 不得再包含内嵌改密表单，正式流程只走 packageC/profile/change-password')
}

if (errs.length) {
  console.error('check-change-password-flow FAILED:')
  for (const e of errs) console.error('  -', e)
  process.exit(1)
}

console.log('check-change-password-flow OK')
