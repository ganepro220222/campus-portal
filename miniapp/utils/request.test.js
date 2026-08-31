/**
 * request.js 401 退出策略单测
 * 运行：node miniapp/utils/request.test.js
 */
const assert = require('assert')

let logoutCalls = 0
const mockApp = { logout() { logoutCalls += 1 } }

const request = require('./request')

const origGetApp = global.getApp
global.getApp = () => mockApp

try {
  logoutCalls = 0
  request._logoutIfNeeded('/auth/account-login')
  assert.strictEqual(logoutCalls, 0, 'account-login 401 不应 logout')

  logoutCalls = 0
  request._logoutIfNeeded('/auth/wx-login')
  assert.strictEqual(logoutCalls, 0)

  logoutCalls = 0
  request._logoutIfNeeded('/auth/wx-bind')
  assert.strictEqual(logoutCalls, 0)

  logoutCalls = 0
  request._logoutIfNeeded('/auth/change-password')
  assert.strictEqual(logoutCalls, 1, 'change-password 401 应 logout')

  logoutCalls = 0
  request._logoutIfNeeded('/auth/session')
  assert.strictEqual(logoutCalls, 1, 'session 401 应 logout')

  logoutCalls = 0
  request._logoutIfNeeded('/auth/wx-bind-authenticated')
  assert.strictEqual(logoutCalls, 1)

  logoutCalls = 0
  request._logoutIfNeeded('/news/1')
  assert.strictEqual(logoutCalls, 1, '普通接口 401 应 logout')

  const clean = request._sanitizeRequestData({ category: undefined, page: 1, q: null })
  assert.deepStrictEqual(clean, { page: 1 }, 'GET 不得把 undefined/null 序列化进 query')
  assert.strictEqual(request._sanitizeRequestData(undefined), undefined)
  assert.deepStrictEqual(request._sanitizeRequestData({ category: '博物馆与校史' }), { category: '博物馆与校史' })

  assert.strictEqual(request._isQueryMethod('GET'), true)
  assert.strictEqual(request._isQueryMethod('delete'), true)
  assert.strictEqual(request._isQueryMethod('POST'), false)
  assert.strictEqual(request._isQueryMethod('PUT'), false)
  const query = request._resolveRequestData('GET', { category: undefined, page: 1, avatar: null })
  assert.deepStrictEqual(query, { page: 1 }, 'GET/DELETE 仍清洗 undefined/null')
  const body = { avatar: null, nickname: '张三', skip: undefined }
  assert.strictEqual(request._resolveRequestData('PUT', body), body, 'PUT 不得剥掉显式 null')
  assert.strictEqual(request._resolveRequestData('POST', body), body, 'POST 不得剥掉显式 null')

  assert.strictEqual(typeof request.downloadToTempFile, 'function')
  assert.strictEqual(typeof request.getArrayBuffer, 'function')

  console.log('[request.test] PASS')
} finally {
  global.getApp = origGetApp
}
