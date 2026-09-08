/**
 * 报名页模块依赖静态检查
 * 运行：node miniapp/utils/enrollPageDeps.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')

const enrollPath = path.join(__dirname, '../packageC/activity/enroll.js')
const enrollWxmlPath = path.join(__dirname, '../packageC/activity/enroll.wxml')
const src = fs.readFileSync(enrollPath, 'utf8')
const wxml = fs.readFileSync(enrollWxmlPath, 'utf8')

function mustInclude(snippet, message) {
  assert.ok(src.includes(snippet), message || `missing: ${snippet}`)
}

mustInclude("require('../../utils/enrollForm')", 'enroll.js must import enrollForm')
mustInclude('validateEnrollForm', 'enroll.js must use validateEnrollForm')
mustInclude("require('../../utils/voucherQrCanvas')", 'enroll.js must import voucherQrCanvas')
mustInclude('exportVoucherQr', 'enroll.js must reference exportVoucherQr')
mustInclude('resolveVoucherQrSrc', 'enroll.js must use resolveVoucherQrSrc')
mustInclude("require('../../utils/enrollPageInit')", 'enroll.js must import enrollPageInit')
mustInclude('buildEnrollLoadedView', 'enroll.js must use buildEnrollLoadedView')
mustInclude('canSubmitEnroll', 'enroll.js must guard submit with canSubmitEnroll')
mustInclude('requestSubscribeMany(buildEnrollSubscribeRequests(this.data.detail.needReview))',
  'enroll.js must request approval subscription for activities requiring review')
mustInclude('onRetry', 'enroll.js must expose onRetry')
mustInclude('onShow', 'enroll.js must resume after login return')
mustInclude('onGoLogin', 'enroll.js must expose onGoLogin')
mustInclude('openLoginPage', 'enroll.js must jump login without a second modal')
mustInclude('authRequired', 'enroll.js must keep an explicit login gate')
mustInclude('buildEnrollAuthRequiredPatch', 'enroll.js must use enroll auth patch')
mustInclude('_authBlocked', 'enroll.js must remember login-blocked state')
mustInclude('shouldResumeEnrollAfterAuth', 'enroll.js must resume only after login')
mustInclude('resolveEnrollSubmitOutcome', 'enroll.js must guard empty enroll result')

assert.ok(wxml.includes('authRequired'), 'enroll.wxml must render login gate')
assert.ok(wxml.includes('该功能需要登录后使用'), 'enroll.wxml must explain login is required')
assert.ok(wxml.includes('onGoLogin'), 'enroll.wxml must bind 去登录')

console.log('[enrollPageDeps.test] PASS')
