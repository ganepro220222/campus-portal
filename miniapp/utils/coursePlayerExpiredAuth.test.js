/**
 * 过期 token 进课程播放页：认证层已提示并跳转登录后，不再盖「课程加载失败」。
 * 真实 player.js + request.js，只假微信请求。
 */
const assert = require('assert')

const requestPath = require.resolve('./request')
const playerPath = require.resolve('../packageB/course/player.js')
const originalRequestCache = require.cache[requestPath]
const originalPlayerCache = require.cache[playerPath]
const originalPage = global.Page
const originalWx = global.wx
const originalGetApp = global.getApp
const originalGetCurrentPages = global.getCurrentPages

const store = {}
const toasts = []
const relaunches = []
let requestHandler = null
let pageDef = null

function resetState() {
  Object.keys(store).forEach((key) => delete store[key])
  toasts.length = 0
  relaunches.length = 0
  require('./auth').clearSessionLogoutLock()
}

const mockApp = {
  globalData: {
    token: '',
    userInfo: null,
    baseUrl: 'https://api.example.edu/api/v1'
  },
  logout() {
    const auth = require('./auth')
    this.globalData.token = ''
    this.globalData.userInfo = null
    if (!auth.beginSessionLogout()) return
    wx.reLaunch({ url: auth.LOGIN_PAGE })
  }
}

global.Page = (def) => {
  pageDef = def
}
global.getApp = () => mockApp
global.getCurrentPages = () => []
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
  showModal() {},
  navigateTo() {},
  reLaunch(options) {
    relaunches.push(options && options.url)
    if (options && options.complete) options.complete()
  },
  request(options) {
    const result = requestHandler && requestHandler(options)
    if (result && typeof result.then === 'function') {
      result.then((res) => options.success && options.success(res), (err) => options.fail && options.fail(err))
      return
    }
    if (options.success) options.success(result)
  },
  createVideoContext() {
    return { seek() {}, play() {} }
  }
}

delete require.cache[requestPath]
delete require.cache[playerPath]
require('../packageB/course/player.js')
assert.ok(pageDef && typeof pageDef._fetchCourse === 'function')

function cloneData(data) {
  return JSON.parse(JSON.stringify(data))
}

function createPage() {
  const page = {
    data: cloneData(pageDef.data),
    _courseId: '',
    _authBlocked: false,
    _fetching: false,
    _pageActive: true,
    _completionNotified: false
  }
  Object.keys(pageDef).forEach((key) => {
    if (typeof pageDef[key] === 'function') {
      page[key] = pageDef[key]
    }
  })
  page.setData = function setData(patch) {
    Object.assign(this.data, patch)
  }
  return page
}

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve))
}

async function flushTurns(times = 6) {
  for (let i = 0; i < times; i += 1) {
    await flushPromises()
  }
}

async function run() {
  {
    resetState()
    store.token = 'expired-token'
    mockApp.globalData.token = 'expired-token'
    requestHandler = () => ({ data: { code: 401, message: '登录已过期' } })
    const page = createPage()
    page.onLoad({ id: '7' })
    await flushTurns()
    const loginToasts = toasts.filter((title) => title === '登录已过期')
    assert.strictEqual(loginToasts.length, 1, '并行 401 只应提示一次登录已过期')
    assert.ok(!toasts.includes('课程加载失败'), '认证失效不得再盖课程加载失败')
    assert.strictEqual(relaunches.length, 1, '并行 401 只应跳转一次登录页')
    assert.ok(String(relaunches[0]).includes('/pages/login/index'))
    assert.strictEqual(page.data.loadError, false)
    assert.strictEqual(page.data.authRequired, true)
    assert.strictEqual(page.data.loading, false)
    assert.strictEqual(store.token, undefined)
  }

  {
    resetState()
    store.token = 'ok-token'
    mockApp.globalData.token = 'ok-token'
    requestHandler = () => {
      const err = new Error('request:fail')
      return Promise.reject(err)
    }
    const page = createPage()
    page.onLoad({ id: '8' })
    await flushTurns()
    assert.ok(toasts.includes('网络异常，请检查连接'))
    assert.ok(toasts.includes('课程加载失败'))
    assert.strictEqual(page.data.loadError, true)
    assert.strictEqual(page.data.authRequired, false)
    assert.strictEqual(relaunches.length, 0)
  }

  console.log('[coursePlayerExpiredAuth.test] PASS')
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    global.Page = originalPage
    global.wx = originalWx
    global.getApp = originalGetApp
    global.getCurrentPages = originalGetCurrentPages
    if (originalRequestCache) require.cache[requestPath] = originalRequestCache
    else delete require.cache[requestPath]
    if (originalPlayerCache) require.cache[playerPath] = originalPlayerCache
    else delete require.cache[playerPath]
  })
