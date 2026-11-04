/**
 * 登录页行为（真跑 pages/login/index.js）：
 *   - 默认面板跟着上次的登录方式走
 *   - 问号同时只开一个，再点收起
 *   - 微信登录失败：服务器原文不被「登录失败，请重试」盖掉；wx.login 本身失败才兜底
 *   - 微信没绑过 → 绑定态，返回时回到原面板
 *   - 学号 / 工号登录：叫法、记住方式、绑定询问、须改密时不抢先问
 *
 * 运行：node miniapp/utils/loginPage.test.js
 */
const assert = require('assert')

const requestPath = require.resolve('./request')
const authPath = require.resolve('./auth')
const pagePath = require.resolve('../pages/login/index.js')

const saved = {
  page: global.Page, wx: global.wx, getApp: global.getApp,
  getCurrentPages: global.getCurrentPages, requestCache: require.cache[requestPath]
}

let store = {}
let toasts = []
let modals = []
let relaunches = []
let navigates = []
let switched = []
let posts = []
let postHandler = () => Promise.resolve({})
let helpResponse = Promise.resolve({})
let gets = []
let wxLoginFails = false
let modalAnswer = { confirm: false }

require.cache[requestPath] = {
  id: requestPath, filename: requestPath, loaded: true,
  exports: {
    get(url, params, opts) {
      gets.push({ url, opts })
      return helpResponse
    },
    post(url, body) {
      posts.push(url)
      return postHandler(url, body)
    }
  }
}

let pageDef = null
global.Page = (def) => { pageDef = def }
const appState = {}
global.getApp = () => ({ globalData: appState, logout() {} })
global.getCurrentPages = () => [{ route: 'pages/login/index' }]
global.wx = {
  getSystemInfoSync: () => ({ statusBarHeight: 24 }),
  getStorageSync: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : ''),
  setStorageSync: (k, v) => { store[k] = v },
  removeStorageSync: (k) => { delete store[k] },
  showToast: (o) => toasts.push(o && o.title),
  showModal: (o) => {
    modals.push(o)
    Promise.resolve().then(() => o.success && o.success(modalAnswer))
  },
  reLaunch: (o) => { relaunches.push(o && o.url); if (o && o.complete) o.complete() },
  navigateTo: (o) => navigates.push(o && o.url),
  navigateBack() {},
  switchTab: (o) => switched.push(o && o.url),
  login: (o) => (wxLoginFails ? o.fail({ errMsg: 'login:fail' }) : o.success({ code: 'code-1' }))
}

delete require.cache[pagePath]
delete require.cache[authPath]
require('../pages/login/index.js')
assert.ok(pageDef, 'Page 没有注册')

function makePage() {
  const page = Object.assign({}, pageDef)
  page.data = JSON.parse(JSON.stringify(pageDef.data))
  page.setData = function (patch) {
    for (const [k, v] of Object.entries(patch)) {
      if (k.includes('.')) {
        const [a, b] = k.split('.')
        this.data[a] = Object.assign({}, this.data[a], { [b]: v })
      } else {
        this.data[k] = v
      }
    }
  }
  return page
}
function reset() {
  toasts = []; modals = []; relaunches = []; navigates = []; switched = []; posts = []
  wxLoginFails = false; modalAnswer = { confirm: false }
}
const flush = () => new Promise((r) => setTimeout(r, 0))
async function settle() { for (let i = 0; i < 6; i++) await flush() }

;(async () => {
  /* —— 默认面板 —— */
  store = {}
  let page = makePage(); page.onLoad()
  assert.strictEqual(page.data.panel, 'wx', '没登录过：先给微信一键登录')
  assert.strictEqual(page.data.accountLabel, '学号 / 工号')
  store = { lastLoginMethod: 'account' }
  page = makePage(); page.onLoad()
  assert.strictEqual(page.data.panel, 'account', '上次用学号 / 工号进来的：默认展开表单')

  /* —— 位数：取自 /auth/login-help，不带 token（号码都是编的） —— */
  store = {}
  helpResponse = Promise.resolve({ studentDigits: 12, staffDigits: 7 })
  gets = []
  page = makePage(); page.onLoad(); await settle()
  assert.deepStrictEqual(gets.map((g) => g.url), ['/auth/login-help'])
  assert.strictEqual(gets[0].opts.anonymous, true, '手机里可能留着失效的旧 token，取格式不能带')
  assert.strictEqual(page.data.tips.account, '学生填 12 位学号，教师填 7 位工号。由学校统一导入，不需要注册。')
  assert.ok(page.data.tips.password.includes('初始密码'), '只改学号那一格，密码问号不动')

  /* 打字时不打扰；失焦才提醒；改对了立刻消失 */
  const typeNo = (v) => page.onInput({ currentTarget: { dataset: { field: 'studentNo' } }, detail: { value: v } })
  const blurNo = () => page.onFieldBlur({ currentTarget: { dataset: { field: 'studentNo' } } })
  typeNo('1234')
  assert.strictEqual(page.data.accountHint, '', '还在打，不提醒')
  typeNo('12345678901'); blurNo()
  assert.strictEqual(page.data.accountHint, '学号 12 位、工号 7 位，这里填了 11 位，请核对')
  typeNo('123456789012')
  assert.strictEqual(page.data.accountHint, '', '改对了立刻消失')
  typeNo('1234567'); blurNo()
  assert.strictEqual(page.data.accountHint, '', '7 位工号也对')

  /* 先失焦、后拿到位数：回来后补一句，不用再点一次输入框 */
  let releaseHelp
  helpResponse = new Promise((resolve) => { releaseHelp = resolve })
  page = makePage(); page.onLoad()
  const lateType = (v) => page.onInput({ currentTarget: { dataset: { field: 'studentNo' } }, detail: { value: v } })
  const lateBlur = () => page.onFieldBlur({ currentTarget: { dataset: { field: 'studentNo' } } })
  lateType('12345678901'); lateBlur()
  assert.strictEqual(page.data.accountHint, '', '位数还没取到，不瞎提醒')
  releaseHelp({ studentDigits: 12, staffDigits: 7 })
  await settle()
  assert.strictEqual(page.data.accountHint, '学号 12 位、工号 7 位，这里填了 11 位，请核对')
  helpResponse = Promise.resolve({ studentDigits: 12, staffDigits: 7 })

  /* 只提醒不拦：位数不对照样发登录请求（建号前的老账号不合格式也得能登） */
  reset()
  postHandler = () => Promise.reject({ code: 401, message: '学号 / 工号或密码错误' })
  page.setData({ panel: 'account', studentNo: 'T2024', password: 'abc12345' }); blurNo()
  assert.ok(page.data.accountHint.includes('只有数字'))
  await page.onAccountLogin(); await settle()
  assert.deepStrictEqual(posts, ['/auth/account-login'], '提醒不能变成拦截')

  /* 取不到格式：问号照旧，不提醒 */
  helpResponse = Promise.reject(new Error('offline'))
  page = makePage(); page.onLoad(); await settle()
  assert.strictEqual(page.data.tips.account, '学生填学号，教师填工号。由学校统一导入，不需要注册。')
  page.setData({ studentNo: '12345678901' }); blurNo()
  assert.strictEqual(page.data.accountHint, '', '不知道位数就不瞎提醒')
  helpResponse = Promise.resolve({})

  /* —— 问号 —— */
  store = { lastLoginMethod: 'account' }
  page = makePage(); page.onLoad()
  page.onToggleTip({ currentTarget: { dataset: { tip: 'account' } } })
  assert.strictEqual(page.data.openTip, 'account')
  page.onToggleTip({ currentTarget: { dataset: { tip: 'password' } } })
  assert.strictEqual(page.data.openTip, 'password', '同时只开一个')
  page.onToggleTip({ currentTarget: { dataset: { tip: 'password' } } })
  assert.strictEqual(page.data.openTip, '', '再点收起')

  /* —— 「无法登录？」 —— */
  reset(); page.onHelp()
  assert.deepStrictEqual(navigates, ['/packageC/help/login'])

  /* —— 微信登录失败：服务器原文不被盖掉 —— */
  store = {}; reset()
  page = makePage(); page.onLoad()
  postHandler = (url) => (url === '/auth/wx-login'
    ? Promise.reject({ code: 400, message: '微信授权码无效或已过期，请重新登录' })
    : Promise.resolve({}))
  await page.onWxLogin(); await settle()
  assert.deepStrictEqual(toasts, [], '页面不能再弹「登录失败，请重试」把服务器原文顶掉')
  assert.strictEqual(page.data.loading, false)

  /* wx.login 本身失败：请求没发出去，页面要兜底 */
  reset(); wxLoginFails = true
  await page.onWxLogin(); await settle()
  assert.deepStrictEqual(posts, [], 'wx.login 失败时不该发请求')
  assert.strictEqual(toasts.length, 1)
  assert.ok(/微信登录/.test(toasts[0]), toasts[0])

  /* —— 没绑过 → 绑定态，返回回原面板 —— */
  reset()
  postHandler = (url) => (url === '/auth/wx-login'
    ? Promise.resolve({ needBind: true, wxBindToken: 'bind-1' })
    : Promise.resolve({}))
  page.setData({ panel: 'account', password: 'typed' })
  await page.onWxLogin(); await settle()
  assert.strictEqual(page.data.panel, 'bind')
  assert.strictEqual(page.data.wxBindToken, 'bind-1')
  assert.strictEqual(page.data.password, '', '进绑定态清掉之前打的密码')
  page.onBack()
  assert.strictEqual(page.data.panel, 'account', '退出绑定回到进来前的面板')
  assert.strictEqual(page.data.wxBindToken, '')

  /* 绑定：校验文案用「学号 / 工号」，成功后记住微信 */
  reset(); store = {}
  await page.onWxLogin(); await settle()
  page.setData({ studentNo: '  ', password: '' })
  await page.onBindWxAccount()
  assert.deepStrictEqual(toasts, ['请输入学号 / 工号'])
  postHandler = (url) => (url === '/auth/wx-bind'
    ? Promise.resolve({ token: 't', member: {}, wxBound: true, mustChangePassword: false })
    : Promise.resolve({}))
  page.setData({ studentNo: '2024001', password: 'abc12345' })
  await page.onBindWxAccount(); await settle()
  assert.ok(posts.includes('/auth/wx-bind'))
  assert.strictEqual(store.lastLoginMethod, 'wx')

  /* —— 学号 / 工号登录 —— */
  reset(); store = {}
  page = makePage(); page.onLoad(); page.onShowAccount()
  assert.strictEqual(page.data.panel, 'account')
  await page.onAccountLogin()
  assert.deepStrictEqual(toasts, ['请输入学号 / 工号'], '叫法统一，不再说「请输入账号」')

  /* 没绑微信：问一次，用的是同一份说法；选以后再说也放行 */
  reset()
  postHandler = (url) => (url === '/auth/account-login'
    ? Promise.resolve({ token: 't', member: {}, wxBound: false, mustChangePassword: false })
    : Promise.resolve({}))
  page.setData({ studentNo: '2024001', password: 'abc12345' })
  await page.onAccountLogin(); await settle()
  assert.strictEqual(modals.length, 1)
  assert.strictEqual(modals[0].title, '绑定这个微信？')
  assert.ok(modals[0].content.includes('不绑也能继续用'))
  assert.strictEqual(store.lastLoginMethod, 'account')
  assert.ok(!posts.includes('/auth/wx-bind-authenticated'))
  assert.deepStrictEqual(switched, ['/pages/index/index'])

  /* 须改密：不抢在改密页前面问绑定（改密页改完会问） */
  reset()
  postHandler = (url) => (url === '/auth/account-login'
    ? Promise.resolve({ token: 't', member: {}, wxBound: false, mustChangePassword: true })
    : Promise.resolve({}))
  await page.onAccountLogin(); await settle()
  assert.strictEqual(modals.length, 0)
  assert.ok(relaunches.some((u) => u && u.startsWith('/packageC/profile/change-password/index')),
    '须改密要直接去改密页')

  console.log('[loginPage.test] PASS')
})().catch((e) => {
  console.error(e)
  process.exitCode = 1
}).finally(() => {
  global.Page = saved.page
  global.wx = saved.wx
  global.getApp = saved.getApp
  global.getCurrentPages = saved.getCurrentPages
  if (saved.requestCache) require.cache[requestPath] = saved.requestCache
  else delete require.cache[requestPath]
})
