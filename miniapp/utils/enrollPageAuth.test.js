/**
 * 活动报名页登录门禁：未登录不得空白，登录返回后由 onShow 恢复加载。
 * 运行：node miniapp/utils/enrollPageAuth.test.js
 */
const assert = require('assert')

const requestPath = require.resolve('./request')
const enrollPath = require.resolve('../packageC/activity/enroll.js')
const originalRequestCache = require.cache[requestPath]
const originalEnrollCache = require.cache[enrollPath]
const originalPage = global.Page
const originalWx = global.wx
const originalGetApp = global.getApp
const originalGetCurrentPages = global.getCurrentPages

const store = {}
const appState = { token: '' }
const gets = []
const modals = []
const navigates = []
const relaunches = []
let getHandler = () => Promise.resolve({})

require.cache[requestPath] = {
  id: requestPath,
  filename: requestPath,
  loaded: true,
  exports: {
    get(url, data, options) {
      gets.push({ url, data, options })
      return getHandler(url, data, options)
    },
    post() {
      return Promise.resolve({})
    }
  }
}

let pageDef = null
global.Page = (def) => {
  pageDef = def
}
global.getApp = () => ({
  globalData: appState,
  isLoggedIn() {
    return !!appState.token
  }
})
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
  showModal(options) {
    modals.push(options)
  },
  navigateTo(options) {
    navigates.push(options && options.url)
  },
  redirectTo() {},
  navigateBack() {},
  reLaunch(options) {
    relaunches.push(options && options.url)
    if (options && options.complete) options.complete()
  },
  showToast() {}
}

delete require.cache[enrollPath]
require('../packageC/activity/enroll.js')
assert.ok(pageDef && typeof pageDef._init === 'function')
assert.ok(typeof pageDef.onShow === 'function')

function cloneData(data) {
  return JSON.parse(JSON.stringify(data))
}

function createPage() {
  const page = {
    data: cloneData(pageDef.data),
    _authBlocked: false,
    _initializing: false
  }
  Object.keys(pageDef).forEach((key) => {
    if (typeof pageDef[key] === 'function') {
      page[key] = pageDef[key]
    }
  })
  page.setData = function setData(patch, cb) {
    Object.assign(this.data, patch)
    if (typeof cb === 'function') cb()
  }
  return page
}

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve))
}

async function flushTurns(times = 4) {
  for (let i = 0; i < times; i += 1) {
    await flushPromises()
  }
}

function resetAuthState() {
  Object.keys(store).forEach((key) => delete store[key])
  appState.token = ''
  gets.length = 0
  modals.length = 0
  navigates.length = 0
  relaunches.length = 0
}

function stubEnrollGets() {
  getHandler = (url) => {
    if (String(url).includes('/profile')) {
      return Promise.resolve({ realName: '张三', phone: '13800138000' })
    }
    return Promise.resolve({
      id: 7,
      title: '讲座',
      location: 'A101',
      startTime: '2026-08-01 14:00',
      enrollStatus: 'none',
      canEnroll: true,
      needReview: false
    })
  }
}

async function run() {
  stubEnrollGets()

  {
    resetAuthState()
    const page = createPage()
    page.onLoad({ id: '7' })
    await flushTurns()
    assert.strictEqual(page.data.loading, false, '没 token 不得停在报名加载中')
    assert.strictEqual(page.data.authRequired, true, '没 token 应提示需要登录')
    assert.strictEqual(page.data.loadError, false)
    assert.strictEqual(page.data.notFound, false)
    assert.strictEqual(page.data.detail, null)
    assert.strictEqual(gets.length, 0, '没 token 不得打报名接口')
    assert.strictEqual(modals.length, 0, '未点去登录不得先弹窗')
    assert.strictEqual(page._authBlocked, true)
  }

  {
    resetAuthState()
    const page = createPage()
    page.onLoad({ id: '7' })
    page.onGoLogin()
    assert.strictEqual(modals.length, 0, '页面已有去登录，不得再弹确认')
    assert.ok(navigates.some((url) => String(url).includes('/pages/login/index')))
    page.onShow()
    await flushTurns()
    assert.strictEqual(page.data.loading, false)
    assert.strictEqual(page.data.authRequired, true)
    assert.strictEqual(page.data.detail, null)
    assert.strictEqual(gets.length, 0, '取消登录返回时 onShow 不得偷偷请求')
    assert.strictEqual(modals.length, 0)
  }

  {
    resetAuthState()
    const page = createPage()
    page.onLoad({ id: '7' })
    page.onGoLogin()
    store.token = 'after-login'
    appState.token = 'after-login'
    page.onShow()
    page.onShow()
    await flushTurns()
    assert.strictEqual(page._authBlocked, false)
    assert.strictEqual(
      gets.filter((item) => item.url === '/activities/7').length,
      1,
      '多次 onShow 不得重复加载活动'
    )
    assert.strictEqual(page.data.loading, false)
    assert.strictEqual(page.data.authRequired, false)
    assert.strictEqual(page.data.detail.title, '讲座')
    assert.strictEqual(page.data.form.name, '张三')
  }

  {
    resetAuthState()
    store.token = 't'
    appState.token = 't'
    store.mustChangePassword = true
    const page = createPage()
    page.onLoad({ id: '7' })
    await flushTurns()
    assert.strictEqual(page.data.loading, false, '须改密不得停在报名加载中')
    assert.strictEqual(page.data.authRequired, true)
    assert.strictEqual(gets.length, 0)
    assert.ok(relaunches.some((url) => String(url).includes('change-password')))
    relaunches.length = 0
    page.onGoLogin()
    assert.ok(relaunches.some((url) => String(url).includes('change-password')))
    assert.strictEqual(navigates.length, 0)
    delete store.mustChangePassword
    page.onShow()
    await flushTurns()
    assert.ok(gets.some((item) => item.url === '/activities/7'), '改密完成后回到报名页应加载活动')
    assert.strictEqual(page.data.detail.title, '讲座')
  }

  {
    resetAuthState()
    store.token = 't'
    appState.token = 't'
    const page = createPage()
    page.onLoad({ id: '7' })
    page.onShow()
    await flushTurns()
    assert.strictEqual(modals.length, 0, '已登录不得弹登录窗')
    assert.strictEqual(
      gets.filter((item) => item.url === '/activities/7').length,
      1,
      '已登录时 onLoad 后的 onShow 不得再打一遍'
    )
    assert.strictEqual(page.data.detail.title, '讲座')
    assert.strictEqual(page.data.loading, false)
    assert.strictEqual(page.data.authRequired, false)
  }

  {
    resetAuthState()
    const page = createPage()
    page.onLoad({ id: '7' })
    page.data.loading = true
    page.onRetry()
    await flushTurns()
    assert.strictEqual(page.data.loading, false, '未登录点重新加载不得先闪加载中')
    assert.strictEqual(page.data.authRequired, true)
    assert.strictEqual(gets.length, 0)
    assert.strictEqual(modals.length, 0)
  }

  console.log('[enrollPageAuth.test] PASS')
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
    if (originalEnrollCache) require.cache[enrollPath] = originalEnrollCache
    else delete require.cache[enrollPath]
  })
