/**
 * uploadFile 响应解析单测
 * 运行：node miniapp/utils/uploadResponse.test.js
 */
const assert = require('assert')
const { parseUploadFileResponse, uploadErrorMessage, isUnauthorized } = require('./uploadResponse')

const okJson = parseUploadFileResponse({
  statusCode: 200,
  data: JSON.stringify({ code: 200, data: { url: 'https://cdn/a.jpg' } })
})
assert.strictEqual(okJson.ok, true)
assert.deepStrictEqual(okJson.data, { url: 'https://cdn/a.jpg' })

const bizFail = parseUploadFileResponse({
  statusCode: 200,
  data: JSON.stringify({ code: 400, message: '文件类型不支持' })
})
assert.strictEqual(bizFail.ok, false)
assert.strictEqual(bizFail.error.message, '文件类型不支持')

const unauthorized = parseUploadFileResponse({
  statusCode: 200,
  data: JSON.stringify({ code: 401, message: '请先登录' })
})
assert.strictEqual(unauthorized.ok, false)
assert.strictEqual(unauthorized.unauthorized, true)

const httpUnauthorized = parseUploadFileResponse({
  statusCode: 401,
  data: JSON.stringify({ code: 401, message: '请先登录' })
})
assert.strictEqual(httpUnauthorized.ok, false)
assert.strictEqual(httpUnauthorized.unauthorized, true)
assert.strictEqual(httpUnauthorized.error.code, 401)
assert.strictEqual(httpUnauthorized.error.message, '请先登录')

assert.strictEqual(isUnauthorized(401, { code: 401 }), true)
assert.strictEqual(isUnauthorized(200, { code: 401 }), true)
assert.strictEqual(isUnauthorized(403, { code: 403 }), false)

const html502 = parseUploadFileResponse({
  statusCode: 502,
  data: '<html><body>Bad Gateway</body></html>'
})
assert.strictEqual(html502.ok, false)
assert.strictEqual(html502.error.message, '上传服务返回异常')
assert.ok(html502.error.cause)

const html413 = parseUploadFileResponse({
  statusCode: 413,
  data: '<html><body>Request Entity Too Large</body></html>'
})
assert.strictEqual(html413.ok, false)
assert.strictEqual(html413.error.message, '上传服务返回异常')

const json413 = parseUploadFileResponse({
  statusCode: 413,
  data: JSON.stringify({ code: 413, message: 'too large' })
})
assert.strictEqual(json413.ok, false)
assert.strictEqual(json413.error.message, '图片过大，请重新选择或压缩')

const emptyBody = parseUploadFileResponse({
  statusCode: 200,
  data: ''
})
assert.strictEqual(emptyBody.ok, false)
assert.strictEqual(emptyBody.error.message, '上传服务返回异常')

const objectBody = parseUploadFileResponse({
  statusCode: 200,
  data: { code: 200, data: { url: 'https://cdn/b.png' } }
})
assert.strictEqual(objectBody.ok, true)
assert.strictEqual(objectBody.data.url, 'https://cdn/b.png')

assert.strictEqual(uploadErrorMessage(413, null), '图片过大，请重新选择或压缩')
assert.strictEqual(uploadErrorMessage(500, { message: '服务异常' }), '服务异常')

console.log('[uploadResponse.test] PASS')
