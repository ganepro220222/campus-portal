/**
 * 消息中心点击：标已读不得挡住详情跳转。
 * 运行：node miniapp/utils/messageCenterPage.test.js
 */
const assert = require('assert')

const requestPath = require.resolve('./request')
const pagePath = require.resolve('../packageC/message/index.js')
const originalRequestCache = require.cache[requestPath]
const originalPageCache = require.cache[pagePath]
const originalPage = global.Page
const originalWx = global.wx

const puts = []
const pendingPuts = []
const navigations = []
const toasts = []

require.cache[requestPath] = {
  id: requestPath,
  filename: requestPath,
  loaded: true,
  exports: {
    get() {
      return Promise.resolve([])
    },
    put(url, body, options) {
      puts.push({ url, body, options })
      return new Promise((resolve, reject) => pendingPuts.push({ resolve, reject, url }))
    }
  }
}

let pageDef = null
global.Page = (def) => {
  pageDef = def
}
global.wx = {
  showToast(options) {
    toasts.push(options && options.title)
  },
  navigateTo(options) {
    navigations.push(options && options.url)
    if (typeof options.fail === 'function' && options._fail) {
      options.fail()
    }
  }
}

delete require.cache[pagePath]
require('../packageC/message/index.js')
assert.ok(pageDef && typeof pageDef.onItemTap === 'function')

function cloneData(data) {
  return JSON.parse(JSON.stringify(data))
}

function createPage(overrides = {}) {
  const page = {
    data: Object.assign(cloneData(pageDef.data), {
      list: [
        {
          id: 12,
          title: '报名审核通过',
          readStatus: 0,
          route: '/packageC/activity/detail?id=9'
        },
        {
          id: 13,
          title: '系统通知',
          readStatus: 0,
          route: ''
        }
      ],
      unreadCount: 9,
      loading: false,
      error: false
    }, overrides),
    _navigating: false,
    _readSyncGen: 0
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

function tap(page, item) {
  page.onItemTap({
    currentTarget: {
      dataset: {
        id: item.id,
        route: item.route
      }
    }
  })
}

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve))
}

async function run() {
  const page = createPage()
  const activity = page.data.list[0]
  tap(page, activity)
  assert.deepStrictEqual(navigations, [activity.route], '有落地页时不得等 PUT 再跳转')
  assert.strictEqual(page.data.list[0].readStatus, 1)
  assert.strictEqual(page.data.unreadCount, 8, '总未读按 9 递减，不能用当前页 1 条未读重算')
  assert.strictEqual(puts.length, 1)
  assert.match(puts[0].url, /\/messages\/12\/read$/)
  assert.strictEqual(puts[0].options.silent, true)
  assert.strictEqual(pendingPuts.length, 1)

  tap(page, activity)
  assert.strictEqual(navigations.length, 1, '跳转未完成前不得连续压入同一详情')
  assert.strictEqual(puts.length, 1, '导航锁应挡住重复标已读')

  pendingPuts[0].resolve()
  await flushPromises()
  assert.deepStrictEqual(navigations, [activity.route])
  assert.strictEqual(toasts.length, 0, '标已读进行中或成功都不得挡跳转、不得弹 toast')

  const failPage = createPage()
  navigations.length = 0
  toasts.length = 0
  tap(failPage, failPage.data.list[0])
  assert.deepStrictEqual(navigations, ['/packageC/activity/detail?id=9'])
  pendingPuts.at(-1).reject(new Error('network'))
  await flushPromises()
  assert.deepStrictEqual(navigations, ['/packageC/activity/detail?id=9'], 'PUT 失败不得撤回或推迟跳转')
  assert.strictEqual(toasts.length, 0, '标已读失败不得用 toast 挡住详情')
  assert.strictEqual(failPage.data.list[0].readStatus, 1)

  const noticePage = createPage()
  navigations.length = 0
  tap(noticePage, noticePage.data.list[1])
  assert.deepStrictEqual(navigations, [], '无落地页应留在当前页')
  assert.strictEqual(noticePage.data.list[1].readStatus, 1)
  assert.strictEqual(noticePage.data.unreadCount, 8)
  pendingPuts.at(-1).resolve()
  await flushPromises()
  assert.strictEqual(noticePage.data.list[1].readStatus, 1)

  noticePage.onShow()
  assert.strictEqual(noticePage._navigating, false)

  const noticeFail = createPage()
  navigations.length = 0
  toasts.length = 0
  tap(noticeFail, noticeFail.data.list[1])
  assert.deepStrictEqual(navigations, [])
  assert.strictEqual(noticeFail.data.list[1].readStatus, 1)
  pendingPuts.at(-1).reject(new Error('network'))
  await flushPromises()
  assert.strictEqual(noticeFail.data.list[1].readStatus, 0, '无落地页时 PUT 失败必须回滚已读')
  assert.strictEqual(noticeFail.data.unreadCount, 9)
  assert.ok(toasts.includes('已读状态同步失败'))

  console.log('[messageCenterPage.test] PASS')
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    global.Page = originalPage
    global.wx = originalWx
    if (originalRequestCache) require.cache[requestPath] = originalRequestCache
    else delete require.cache[requestPath]
    if (originalPageCache) require.cache[pagePath] = originalPageCache
    else delete require.cache[pagePath]
  })
