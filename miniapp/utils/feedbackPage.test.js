/**
 * 意见反馈页登录与上传错误文案单测
 * 运行：node miniapp/utils/feedbackPage.test.js
 */
const assert = require('assert')
const {
  canAccessFeedback,
  isFeedbackSubmitLocked,
  shouldNavigateBackAfterSubmit,
  resolveUploadErrorMessage,
  canStartChooseImages
} = require('./feedbackPage')

assert.strictEqual(canAccessFeedback(true), true)
assert.strictEqual(canAccessFeedback(false), false)

assert.strictEqual(resolveUploadErrorMessage({ code: 401, message: '请先登录' }), '请先登录后再上传图片')
assert.strictEqual(resolveUploadErrorMessage({ code: 413, message: 'x' }), '图片过大，请重新选择或压缩')
assert.strictEqual(resolveUploadErrorMessage({ code: 500, message: '服务异常' }), '服务异常')
assert.strictEqual(resolveUploadErrorMessage(null), '图片上传失败，可点图片重试')
assert.strictEqual(resolveUploadErrorMessage({ message: 'invalid upload url' }), '上传响应异常，请重试或删除该图')
assert.strictEqual(canStartChooseImages({ choosing: true, loggedIn: true, remaining: 2 }).ok, false)
assert.strictEqual(canStartChooseImages({ choosing: false, loggedIn: false, remaining: 2 }).reason, 'login')
assert.strictEqual(canStartChooseImages({ choosing: false, loggedIn: true, remaining: 0 }).reason, 'full')
assert.strictEqual(canStartChooseImages({ choosing: false, loggedIn: true, remaining: 2 }).ok, true)

assert.strictEqual(isFeedbackSubmitLocked({ submitting: false, submitted: false }), false)
assert.strictEqual(isFeedbackSubmitLocked({ submitting: true, submitted: false }), true)
assert.strictEqual(isFeedbackSubmitLocked({ submitting: false, submitted: true }), true)

assert.strictEqual(shouldNavigateBackAfterSubmit([
  { route: 'pages/index/index' },
  { route: 'packageC/feedback/index' }
], 'packageC/feedback/index'), true)
assert.strictEqual(shouldNavigateBackAfterSubmit([
  { route: 'packageC/feedback/index' }
], 'packageC/feedback/index'), false)
assert.strictEqual(shouldNavigateBackAfterSubmit([
  { route: 'pages/index/index' },
  { route: 'pages/profile/index' }
], 'packageC/feedback/index'), false)

console.log('[feedbackPage.test] PASS')
