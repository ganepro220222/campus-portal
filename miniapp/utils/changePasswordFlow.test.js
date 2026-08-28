/**
 * 改密页 401 与退出竞态单测
 * 运行：node miniapp/utils/changePasswordFlow.test.js
 */
const assert = require('assert')
const {
  shouldApplyChangePasswordSuccess,
  changePassword401PageAction,
  canLogoutDuringChangePassword
} = require('./changePasswordFlow')

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
