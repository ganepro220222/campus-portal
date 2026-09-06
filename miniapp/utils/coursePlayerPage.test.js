/**
 * 课程播放页：进度响应必须同步状态文案，完成提示同一生命周期只出现一次。
 * 运行：node miniapp/utils/coursePlayerPage.test.js
 */
const assert = require('assert')

const requestPath = require.resolve('./request')
const authPath = require.resolve('./auth')
const playerPath = require.resolve('../packageB/course/player.js')
const originalRequestCache = require.cache[requestPath]
const originalAuthCache = require.cache[authPath]
const originalPlayerCache = require.cache[playerPath]
const originalPage = global.Page
const originalWx = global.wx

const posts = []
const pendingPosts = []
const toasts = []
const seeks = []

require.cache[requestPath] = {
  id: requestPath,
  filename: requestPath,
  loaded: true,
  exports: {
    get() {
      return Promise.resolve({})
    },
    post(url, body) {
      posts.push({ url, body })
      return new Promise((resolve, reject) => pendingPosts.push({ resolve, reject, url, body }))
    }
  }
}
require.cache[authPath] = {
  id: authPath,
  filename: authPath,
  loaded: true,
  exports: {
    requireLogin(callback) {
      callback()
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
  createVideoContext() {
    return {
      seek(pos) { seeks.push(pos) },
      play() {}
    }
  }
}

delete require.cache[playerPath]
require('../packageB/course/player.js')
assert.ok(pageDef && typeof pageDef._reportProgress === 'function')

function cloneData(data) {
  return JSON.parse(JSON.stringify(data))
}

function createPage(overrides = {}) {
  const page = {
    data: Object.assign(cloneData(pageDef.data), overrides),
    _courseId: '7',
    _completionNotified: false,
    _pageActive: true,
    _currentDuration: 600,
    _currentPosition: 0,
    _lastReportSec: 0
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

async function flushTurns(times = 3) {
  for (let i = 0; i < times; i += 1) {
    await flushPromises()
  }
}

function completionToasts() {
  return toasts.filter((title) => title === '课程学习完成')
}

async function run() {
  const page = createPage({
    progressPercent: 0,
    completed: false,
    progressStatusText: '开始学习'
  })

  const mid = page._reportProgress(240, 600, { notifyCompletion: true })
  pendingPosts.at(-1).resolve({ progressPercent: 40, completed: false })
  await mid
  assert.strictEqual(page.data.progressPercent, 40)
  assert.strictEqual(page.data.completed, false)
  assert.strictEqual(page.data.progressStatusText, '已学习 40%', '周期上报必须更新学习文案')
  assert.strictEqual(completionToasts().length, 0)

  const done = page._reportProgress(600, 600, { notifyCompletion: true })
  pendingPosts.at(-1).resolve({ progressPercent: 100, completed: true })
  await done
  assert.strictEqual(page.data.progressPercent, 100)
  assert.strictEqual(page.data.completed, true)
  assert.strictEqual(page.data.progressStatusText, '已完成学习')
  assert.strictEqual(completionToasts().length, 1, '周期上报完成时应提示一次')

  await page.onEnded({ detail: { duration: 600 } })
  await flushTurns()
  assert.strictEqual(completionToasts().length, 1, 'ended 不得重复提示')
  assert.deepStrictEqual(seeks, [0])

  const hidePage = createPage({
    progressPercent: 80,
    completed: false,
    progressStatusText: '已学习 80%'
  })
  hidePage._currentPosition = 600
  hidePage.onHide()
  assert.strictEqual(hidePage._pageActive, false)
  assert.match(posts.at(-1).url, /\/courses\/7\/progress$/)
  pendingPosts.at(-1).resolve({ progressPercent: 100, completed: true })
  await flushTurns()
  assert.strictEqual(hidePage.data.completed, true)
  assert.strictEqual(hidePage.data.progressStatusText, '已完成学习')
  assert.strictEqual(completionToasts().length, 1, 'onHide 补报完成不得弹迟到 toast')

  const unloadPage = createPage({
    progressPercent: 80,
    completed: false,
    progressStatusText: '已学习 80%'
  })
  unloadPage._currentPosition = 600
  unloadPage.onUnload()
  assert.strictEqual(unloadPage._pageActive, false)
  pendingPosts.at(-1).resolve({ progressPercent: 100, completed: true })
  await flushTurns()
  assert.strictEqual(unloadPage.data.completed, true)
  assert.strictEqual(unloadPage.data.progressStatusText, '已完成学习')
  assert.strictEqual(completionToasts().length, 1, 'onUnload 补报完成不得弹迟到 toast')

  const pausePage = createPage({
    progressPercent: 90,
    completed: false,
    progressStatusText: '已学习 90%'
  })
  pausePage._currentPosition = 600
  pausePage.onPause()
  pendingPosts.at(-1).resolve({ progressPercent: 100, completed: true })
  await flushTurns()
  assert.strictEqual(pausePage.data.progressStatusText, '已完成学习')
  assert.strictEqual(completionToasts().length, 2, '暂停时首次完成仍应提示')

  const concurrentPage = createPage({
    progressPercent: 90,
    completed: false,
    progressStatusText: '已学习 90%'
  })
  const concurrentBefore = completionToasts().length
  const first = concurrentPage._reportProgress(599, 600, { notifyCompletion: true })
  const second = concurrentPage._reportProgress(600, 600, { notifyCompletion: true })
  pendingPosts.at(-2).resolve({ progressPercent: 100, completed: true })
  pendingPosts.at(-1).resolve({ progressPercent: 100, completed: true })
  await Promise.all([first, second])
  assert.strictEqual(concurrentPage.data.completed, true)
  assert.strictEqual(concurrentPage.data.progressStatusText, '已完成学习')
  assert.strictEqual(completionToasts().length, concurrentBefore + 1, '并发完成上报只提示一次')

  const leavePage = createPage({
    progressPercent: 90,
    completed: false,
    progressStatusText: '已学习 90%'
  })
  const leaveBefore = completionToasts().length
  leavePage._currentPosition = 600
  leavePage.onHide()
  leavePage.onPause()
  assert.strictEqual(leavePage._pageActive, false, 'onHide 必须先把页面标成非活动')
  pendingPosts.at(-2).resolve({ progressPercent: 100, completed: true })
  pendingPosts.at(-1).resolve({ progressPercent: 100, completed: true })
  await flushTurns()
  assert.strictEqual(leavePage.data.completed, true)
  assert.strictEqual(leavePage.data.progressStatusText, '已完成学习')
  assert.strictEqual(completionToasts().length, leaveBefore, '离开页后的 hide+pause 不得弹完成提示')

  const pauseThenHide = createPage({
    progressPercent: 90,
    completed: false,
    progressStatusText: '已学习 90%'
  })
  const pauseThenHideBefore = completionToasts().length
  pauseThenHide._currentPosition = 600
  pauseThenHide.onPause()
  pauseThenHide.onHide()
  assert.strictEqual(pauseThenHide._pageActive, false)
  pendingPosts.at(-2).resolve({ progressPercent: 100, completed: true })
  pendingPosts.at(-1).resolve({ progressPercent: 100, completed: true })
  await flushTurns()
  assert.strictEqual(pauseThenHide.data.completed, true)
  assert.strictEqual(completionToasts().length, pauseThenHideBefore, '先 pause 再 hide 也不得在离页后弹提示')

  console.log('[coursePlayerPage.test] PASS')
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
    if (originalAuthCache) require.cache[authPath] = originalAuthCache
    else delete require.cache[authPath]
    if (originalPlayerCache) require.cache[playerPath] = originalPlayerCache
    else delete require.cache[playerPath]
  })
