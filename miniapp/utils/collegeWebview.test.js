/**
 * 学院 web-view 启动参数单测
 * 运行：node miniapp/utils/collegeWebview.test.js
 */
const assert = require('assert')
const { decodeQueryComponent, resolveWebviewBoot, WEBVIEW_ROUTE } = require('./collegeWebview')
const { shouldNavigateBackAfterSubmit } = require('./feedbackPage')

assert.strictEqual(decodeQueryComponent('', '学院内容').value, '学院内容')
assert.strictEqual(decodeQueryComponent('https%3A%2F%2Fa.example%2Fx', '').value, 'https://a.example/x')
assert.strictEqual(decodeQueryComponent('%E0%A4%A', 'x').ok, false)

assert.strictEqual(resolveWebviewBoot({ url: 'https%3A%2F%2Fcdn.example%2Fvr' }).ok, true)
assert.strictEqual(resolveWebviewBoot({ url: 'https%3A%2F%2Fcdn.example%2Fvr' }).url, 'https://cdn.example/vr')
assert.strictEqual(resolveWebviewBoot({ url: '%E0%A4%A' }).ok, false)
assert.strictEqual(resolveWebviewBoot({ url: '%E0%A4%A' }).reason, 'decode')
assert.strictEqual(resolveWebviewBoot({ url: 'http://insecure.example' }).ok, false)
assert.strictEqual(resolveWebviewBoot({}).ok, false)
assert.strictEqual(resolveWebviewBoot({
  url: 'https%3A%2F%2Fcdn.example%2Fvr',
  title: '%E5%B1%95%E9%A6%86'
}).title, '展馆')
assert.strictEqual(resolveWebviewBoot({
  url: 'https%3A%2F%2Fcdn.example%2Fvr',
  title: '%E0%A4%A'
}).title, '学院内容')

assert.strictEqual(shouldNavigateBackAfterSubmit([
  { route: 'pages/index/index' },
  { route: WEBVIEW_ROUTE }
], WEBVIEW_ROUTE), true)
assert.strictEqual(shouldNavigateBackAfterSubmit([
  { route: WEBVIEW_ROUTE }
], WEBVIEW_ROUTE), false)

console.log('[collegeWebview.test] PASS')
