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

  assert.strictEqual(request.COURSE_VIDEO_UPDATED, 'COURSE_VIDEO_UPDATED')
  assert.strictEqual(typeof request.getArrayBufferChunk, 'function')
  assert.strictEqual(typeof request.getUrlArrayBufferChunk, 'function')

} finally {
  global.getApp = origGetApp
}

/* anonymous：公开接口不带 token。手机里留着失效的旧 token 时，
   带上它去取「无法登录」问答会被当成登录过期踢回登录页。 */
;(async () => {
  const origWx = global.wx
  const seen = []
  global.getApp = () => ({ globalData: { token: 'stale-token' }, logout() { logoutCalls += 1 } })
  global.wx = {
    getStorageSync: () => '',
    showToast() {},
    request(opts) {
      seen.push(opts.header.Authorization)
      opts.success({ data: { code: 200, data: { ok: true } } })
    }
  }
  try {
    await request.get('/auth/login-help', {}, { anonymous: true, silent: true })
    await request.get('/news/1')
    assert.deepStrictEqual(seen, ['', 'Bearer stale-token'],
      'anonymous 只对这一次请求生效，其余请求照常带 token')
    console.log('[request.test] PASS')
  } finally {
    global.wx = origWx
    global.getApp = origGetApp
  }
})().catch((e) => { console.error(e); process.exitCode = 1 })
