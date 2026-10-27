/**
 * 首次改密成功后补问绑定微信（真跑改密页 onChangePassword）。
 * 原来改完直接回首页，新用户永远轮不到绑定询问。
 * 运行：node miniapp/utils/changePasswordBindPrompt.test.js
 */
const assert = require('assert')

const requestPath = require.resolve('./request')
const pagePath = require.resolve('../packageC/profile/change-password/index.js')
const authPath = require.resolve('./auth')

const saved = {
  page: global.Page, wx: global.wx, getApp: global.getApp,
  getCurrentPages: global.getCurrentPages, setTimeout: global.setTimeout,
  requestCache: require.cache[requestPath]
}

const store = {}
const appState = { token: 't-old' }
let posts = []
let modals = []
let relaunches = []
let toasts = []
let changeResult = {}
let bindShouldFail = false
let modalAnswer = { confirm: true }

require.cache[requestPath] = {
  id: requestPath, filename: requestPath, loaded: true,
  exports: {
    get() { return Promise.resolve({}) },
    post(url, body) {
      posts.push(url)
      if (url === '/auth/change-password') return Promise.resolve(changeResult)
      if (url === '/auth/wx-bind-authenticated') {
        return bindShouldFail
          ? Promise.reject({ code: 400, message: '该微信已绑定其他学号 / 工号' })
          : Promise.resolve({ token: 't-bound', member: {}, wxBound: true })
      }
      return Promise.resolve({})
    }
  }
}

let pageDef = null
global.Page = (def) => { pageDef = def }
global.getApp = () => ({ globalData: appState, logout() {} })
global.getCurrentPages = () => []
/* 延时一律立刻执行，测试不用等真时间 */
global.setTimeout = (fn) => { fn(); return 0 }
global.wx = {
  getSystemInfoSync: () => ({ statusBarHeight: 20 }),
  getStorageSync: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : ''),
  setStorageSync: (k, v) => { store[k] = v },
  removeStorageSync: (k) => { delete store[k] },
  showToast: (o) => toasts.push(o && o.title),
  showModal: (o) => {
    modals.push(o)
    Promise.resolve().then(() => o.success && o.success(modalAnswer))
  },
  reLaunch: (o) => { relaunches.push(o && o.url); if (o && o.complete) o.complete() },
  navigateBack() {},
  login: (o) => o.success({ code: 'code-1' })
}

delete require.cache[pagePath]
delete require.cache[authPath]
require('../packageC/profile/change-password/index.js')
assert.ok(pageDef && typeof pageDef.onChangePassword === 'function')

function makePage(mode) {
  const page = Object.assign({}, pageDef)
  page.data = JSON.parse(JSON.stringify(pageDef.data))
  Object.assign(page.data, {
    mode,
    showOldPassword: mode === 'voluntary',
    oldPassword: mode === 'voluntary' ? 'old-pass-1' : '',
    newPassword: 'abcd1234',
    confirmPassword: 'abcd1234'
  })
  page._submitSeq = 0
  page.setData = function (patch) { Object.assign(this.data, patch) }
  return page
}

const flush = () => new Promise((r) => saved.setTimeout(r, 0))

async function run(mode, result, answer) {
  posts = []; modals = []; relaunches = []; toasts = []
  changeResult = result
  modalAnswer = answer || { confirm: true }
  const page = makePage(mode)
  await page.onChangePassword()
  for (let i = 0; i < 5; i++) await flush()
  return page
}

;(async () => {
  /* 1. 首次改密、还没绑：问；确认后真去绑，再回首页 */
  await run('forced', { token: 't-new', member: {}, wxBound: false })
  assert.strictEqual(modals.length, 1, '首次改密成功且没绑微信，必须问一次')
  assert.strictEqual(modals[0].title, '绑定这个微信？')
  assert.ok(modals[0].content.includes('不绑也能继续用'))
  assert.deepStrictEqual(posts, ['/auth/change-password', '/auth/wx-bind-authenticated'])
  assert.ok(toasts.includes('绑定成功'))
  assert.deepStrictEqual(relaunches, ['/pages/index/index'])

  /* 2. 选「以后再说」：不绑，直接回首页 */
  await run('forced', { token: 't-new', member: {}, wxBound: false }, { confirm: false })
  assert.strictEqual(modals.length, 1)
  assert.deepStrictEqual(posts, ['/auth/change-password'], '不绑就不能去调绑定接口')
  assert.deepStrictEqual(relaunches, ['/pages/index/index'])

  /* 3. 绑定失败（这个微信已绑了别人）：照样放行回首页，不卡在改密页 */
  bindShouldFail = true
  await run('forced', { token: 't-new', member: {}, wxBound: false })
  bindShouldFail = false
  assert.deepStrictEqual(posts, ['/auth/change-password', '/auth/wx-bind-authenticated'])
  assert.deepStrictEqual(relaunches, ['/pages/index/index'], '绑定失败也要放行')
  assert.ok(!toasts.includes('绑定成功'))

  /* 4. 已经绑着微信：不问 */
  await run('forced', { token: 't-new', member: {}, wxBound: true })
  assert.strictEqual(modals.length, 0)
  assert.deepStrictEqual(relaunches, ['/pages/index/index'])

  /* 5. 自愿改密：不打扰 */
  await run('voluntary', { token: 't-new', member: {}, wxBound: false })
  assert.strictEqual(modals.length, 0, '自愿改密的人已经在用了，不再追问')
  assert.deepStrictEqual(relaunches, ['/pages/index/index'])

  console.log('[changePasswordBindPrompt.test] PASS')
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
}).finally(() => {
  global.Page = saved.page
  global.wx = saved.wx
  global.getApp = saved.getApp
  global.getCurrentPages = saved.getCurrentPages
  global.setTimeout = saved.setTimeout
  if (saved.requestCache) require.cache[requestPath] = saved.requestCache
  else delete require.cache[requestPath]
})
