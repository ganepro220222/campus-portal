/**
 * 改密页 401 与退出竞态单测
 * 运行：node miniapp/utils/changePasswordFlow.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {
  shouldApplyChangePasswordSuccess,
  changePassword401PageAction,
  canLogoutDuringChangePassword
} = require('./changePasswordFlow')

const pageJs = fs.readFileSync(
  path.join(__dirname, '../packageC/profile/change-password/index.js'),
  'utf8'
)
assert.match(pageJs, /require\(['"]\.\.\/\.\.\/\.\.\/utils\/changePasswordFlow['"]\)/,
  '改密页须 require changePasswordFlow')
for (const fn of ['shouldApplyChangePasswordSuccess', 'changePassword401PageAction', 'canLogoutDuringChangePassword']) {
  assert.match(pageJs, new RegExp(fn), `改密页须调用 ${fn}`)
}
assert.doesNotMatch(pageJs, /setTimeout\(\(\) => getApp\(\)\.logout\(\)/,
  '改密页不应 setTimeout 二次 logout')

assert.strictEqual(shouldApplyChangePasswordSuccess(1, 1), true)
assert.strictEqual(shouldApplyChangePasswordSuccess(1, 2), false)

const fixed401 = changePassword401PageAction({ code: 401 }, true)
assert.strictEqual(fixed401.toast, '登录已失效，请重新登录')
assert.strictEqual(fixed401.callLogout, false, 'request 层已 logout 时页面不应再 logout')

const legacy401 = changePassword401PageAction({ code: 401 }, false)
assert.strictEqual(legacy401.callLogout, true)

assert.strictEqual(canLogoutDuringChangePassword(true), false)
assert.strictEqual(canLogoutDuringChangePassword(false), true)

let logoutCalls = 0
const request = require('./request')
const origGetApp = global.getApp
global.getApp = () => ({ logout() { logoutCalls += 1 } })

try {
  logoutCalls = 0
  request._logoutIfNeeded('/auth/change-password')
  const page401 = changePassword401PageAction({ code: 401 }, true)
  if (page401.callLogout) getApp().logout()
  assert.strictEqual(logoutCalls, 1, '401 全流程 logout 只能一次')
} finally {
  global.getApp = origGetApp
}

console.log('[changePasswordFlow.test] PASS')
