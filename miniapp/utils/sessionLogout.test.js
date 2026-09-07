/**
 * 会话退出只跳一次登录页：锁在认证层，不在单个页面里各自规避。
 * 覆盖课程播放器以外的并发 401（首页四接口）。
 */
const assert = require('assert')

const store = {}
const toasts = []
const relaunches = []

global.wx = {
  getStorageSync(key) {
    return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : ''
  },
  setStorageSync(key, value) {
    store[key] = value
  },
  removeStorageSync(key) {
    delete store[key]
  },
  showToast(options) {
    toasts.push(options && options.title)
  },
  reLaunch(options) {
    relaunches.push(options && options.url)
    if (options && options.complete) options.complete()
  },
  request(options) {
    if (options.success) {
      options.success({ data: { code: 401, message: '登录已过期' } })
    }
  }
}

const mockApp = {
  globalData: {
    token: 'expired',
    userInfo: { id: 1 },
    baseUrl: 'https://api.example.edu/api/v1'
  },
  logout() {
    const session = require('./auth')
    this.globalData.token = ''
    this.globalData.userInfo = null
    if (!session.beginSessionLogout()) return
    wx.reLaunch({ url: session.LOGIN_PAGE })
  }
}

global.getApp = () => mockApp
global.getCurrentPages = () => [{ route: 'pages/index/index' }]

const auth = require('./auth')
const request = require('./request')

function reset() {
  Object.keys(store).forEach((key) => delete store[key])
  toasts.length = 0
  relaunches.length = 0
  auth.clearSessionLogoutLock()
  mockApp.globalData.token = 'expired'
  mockApp.globalData.userInfo = { id: 1 }
  global.getCurrentPages = () => [{ route: 'pages/index/index' }]
}

reset()
store.token = 'expired'
assert.strictEqual(auth.beginSessionLogout(), true)
assert.strictEqual(auth.beginSessionLogout(), false)
assert.ok(!Object.prototype.hasOwnProperty.call(store, 'token'))

reset()
store.token = 'expired'
global.getCurrentPages = () => [{ route: 'pages/login/index' }]
assert.strictEqual(auth.beginSessionLogout(), false)
assert.ok(!Object.prototype.hasOwnProperty.call(store, 'token'))
assert.strictEqual(relaunches.length, 0)

reset()
store.token = 'expired'
assert.strictEqual(auth.beginSessionLogout(), true)
assert.strictEqual(auth.beginSessionLogout(), false)
auth.applyLoginData({ token: 'new-token', member: { id: 2 } })
assert.strictEqual(auth.beginSessionLogout(), true)

async function runParallelHome401() {
  reset()
  store.token = 'expired'
  mockApp.globalData.token = 'expired'
  await Promise.all([
    request.get('/banners').catch(() => {}),
    request.get('/home/recommends').catch(() => {}),
    request.get('/colleges/home').catch(() => {}),
    request.get('/home/nav-items').catch(() => {})
  ])
  const expiredToasts = toasts.filter((title) => title === '登录已过期')
  assert.strictEqual(expiredToasts.length, 1, '首页并发 401 只应提示一次')
  assert.strictEqual(relaunches.length, 1, '首页并发 401 只应跳转一次登录页')
  assert.ok(String(relaunches[0]).includes('/pages/login/index'))

  await request.get('/announcements/active').catch(() => {})
  assert.strictEqual(relaunches.length, 1, '迟到的 401 不得再跳转')
}

runParallelHome401()
  .then(() => {
    console.log('[sessionLogout.test] PASS')
  })
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
