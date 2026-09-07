/**
 * 课程播放页登录门禁：没 token / 须改密时不能停在「课程加载中…」。
 * 用真实 auth.js + 假 wx，覆盖深链/开发者工具直开播放页。
 * 运行：node miniapp/utils/coursePlayerAuth.test.js
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
global.getApp = () => ({ globalData: {} })
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
  reLaunch(options) {
    relaunches.push(options && options.url)
    if (options && options.complete) options.complete()
  },
  showToast() {},
  createVideoContext() {
    return { seek() {}, play() {} }
  }
}

delete require.cache[playerPath]
require('../packageB/course/player.js')
assert.ok(pageDef && typeof pageDef._loadCourse === 'function')

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

async function flushTurns(times = 4) {
  for (let i = 0; i < times; i += 1) {
    await flushPromises()
  }
}

function resetAuthState() {
  Object.keys(store).forEach((key) => delete store[key])
  gets.length = 0
  modals.length = 0
  navigates.length = 0
  relaunches.length = 0
}

function stubCourseGets() {
  getHandler = (url) => {
    if (String(url).includes('/play')) return Promise.resolve({ videoUrl: 'https://cdn.example/c.mp4' })
    if (String(url).includes('/progress')) return Promise.resolve({ progressPercent: 0, completed: false })
    return Promise.resolve({ name: '测试课', cover: '' })
  }
}

async function run() {
  stubCourseGets()

  {
    resetAuthState()
    const page = createPage()
    page.onLoad({ id: '7' })
    await flushTurns()
    assert.strictEqual(page.data.loading, false, '没 token 不得停在课程加载中')
    assert.strictEqual(page.data.authRequired, true, '没 token 应提示登录后观看')
    assert.strictEqual(page.data.loadError, false, '没 token 不得写成课程加载失败')
    assert.strictEqual(gets.length, 0, '没 token 不得打课程接口')
    assert.strictEqual(modals.length, 0, '未点去登录不得先弹窗')
    assert.strictEqual(page._authBlocked, true)
  }

  {
    resetAuthState()
    const page = createPage()
    page.onLoad({ id: '7' })
    page.onGoLogin()
    assert.strictEqual(modals.length, 1)
    modals[0].success({ confirm: false })
    page.onShow()
    await flushTurns()
    assert.strictEqual(page.data.loading, false)
    assert.strictEqual(page.data.authRequired, true)
    assert.strictEqual(page.data.loadError, false)
    assert.strictEqual(gets.length, 0, '取消登录后 onShow 不得偷偷请求')
    assert.strictEqual(modals.length, 1, '仍未登录时 onShow 不得再弹窗')
    assert.strictEqual(navigates.length, 0)
  }

  {
    resetAuthState()
    const page = createPage()
    page.onLoad({ id: '7' })
    page.onGoLogin()
    modals[0].success({ confirm: true })
    assert.ok(navigates.some((url) => String(url).includes('/pages/login/index')))
    assert.strictEqual(gets.length, 0)
    store.token = 'after-login'
    page.onShow()
    await flushTurns()
    assert.strictEqual(page._authBlocked, false)
    assert.ok(gets.some((item) => item.url === '/courses/7'))
    assert.strictEqual(page.data.loading, false)
    assert.strictEqual(page.data.loadError, false)
    assert.strictEqual(page.data.authRequired, false)
    assert.strictEqual(page.data.videoUrl, 'https://cdn.example/c.mp4')
  }

  {
    resetAuthState()
    store.token = 't'
    store.mustChangePassword = true
    const page = createPage()
    page.onLoad({ id: '7' })
    await flushTurns()
    assert.strictEqual(page.data.loading, false, '须改密不得停在课程加载中')
    assert.strictEqual(page.data.authRequired, true)
    assert.strictEqual(page.data.loadError, false)
    assert.strictEqual(gets.length, 0)
    assert.ok(relaunches.some((url) => String(url).includes('change-password')))
    delete store.mustChangePassword
    page.onShow()
    await flushTurns()
    assert.ok(gets.some((item) => item.url === '/courses/7'), '改密完成后回到播放页应拉课')
    assert.strictEqual(page.data.videoUrl, 'https://cdn.example/c.mp4')
  }

  {
    resetAuthState()
    store.token = 't'
    const page = createPage()
    page.onLoad({ id: '7' })
    await flushTurns()
    assert.strictEqual(modals.length, 0, '已登录不得弹登录窗')
    assert.strictEqual(page.data.videoUrl, 'https://cdn.example/c.mp4')
    assert.strictEqual(page.data.loading, false)
  }

  {
    resetAuthState()
    const page = createPage()
    page.onLoad({ id: '7' })
    page.data.loading = true
    page.onRetryLoad()
    await flushTurns()
    assert.strictEqual(page.data.loading, false, '未登录点重新加载不得先闪加载中')
    assert.strictEqual(page.data.authRequired, true)
    assert.strictEqual(page.data.loadError, false)
    assert.strictEqual(gets.length, 0)
    assert.strictEqual(modals.length, 0, '重新加载未登录只回到登录提示，不弹窗')
  }

  console.log('[coursePlayerAuth.test] PASS')
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
