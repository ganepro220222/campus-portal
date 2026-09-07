/**
 * 课程播放页：进度响应必须同步状态文案，完成提示同一生命周期只出现一次。
 * 运行：node miniapp/utils/coursePlayerPage.test.js
 */
const assert = require('assert')
const { resolvePlayerStage } = require('./coursePlayerProgress')

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
const gets = []
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
    },
    getToken() {
      return 'test-token'
    },
    isMustChangePasswordRequired() {
      return false
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
    _lastReportSec: 0,
    _progressInteracted: false,
    _progressResumeFromReport: false
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

  const recoverPage = createPage({
    progressPercent: 0,
    completed: false,
    progressLoadError: true,
    progressKnown: false,
    progressStatusText: '学习进度暂未加载',
    offerResumeJump: false,
    savedPosition: 0
  })
  const seeksBeforeRecover = seeks.length
  const recover = recoverPage._reportProgress(0, 600)
  pendingPosts.at(-1).resolve({
    lastPositionSeconds: 300,
    progressPercent: 50,
    completed: false,
    totalDurationSeconds: 600
  })
  await recover
  assert.strictEqual(recoverPage.data.progressLoadError, false, '上报带回上次位置后应去掉失败条')
  assert.strictEqual(recoverPage.data.progressStatusText, '已学习 50%')
  assert.strictEqual(recoverPage.data.savedPosition, 300)
  assert.strictEqual(seeks.at(-1), 300, '未操作时应自动跳到上次位置')
  assert.strictEqual(seeks.length, seeksBeforeRecover + 1)
  assert.ok(toasts.includes('已恢复至 5:00'))
  assert.strictEqual(recoverPage._progressResumeFromReport, true)

  const secondReport = recoverPage._reportProgress(20, 600)
  pendingPosts.at(-1).resolve({
    lastPositionSeconds: 300,
    progressPercent: 50,
    completed: false,
    totalDurationSeconds: 600
  })
  await secondReport
  assert.strictEqual(seeks.length, seeksBeforeRecover + 1, '后续周期上报不得再次跳转')
  assert.strictEqual(recoverPage.data.offerResumeJump, false)

  const offerPage = createPage({
    progressPercent: 0,
    completed: false,
    progressLoadError: true,
    progressKnown: false,
    progressStatusText: '学习进度暂未加载',
    offerResumeJump: false,
    savedPosition: 0
  })
  offerPage._progressInteracted = true
  offerPage._currentPosition = 40
  const offerSeeksBefore = seeks.length
  const offer = offerPage._reportProgress(40, 600)
  pendingPosts.at(-1).resolve({
    lastPositionSeconds: 300,
    progressPercent: 50,
    completed: false,
    totalDurationSeconds: 600
  })
  await offer
  assert.strictEqual(offerPage.data.progressLoadError, false)
  assert.strictEqual(offerPage.data.offerResumeJump, true, '已经在看时应只提示跳转')
  assert.strictEqual(seeks.length, offerSeeksBefore)
  assert.ok(toasts.includes('已找到上次位置 5:00'))

  function createVideoPage() {
    const page = createPage({
      videoUrl: 'https://cdn.example/old.mp4',
      videoFailed: false,
      loading: false,
      loadError: false,
      playing: true,
      initialTime: 120
    })
    page._videoRetryCount = 0
    page._videoReloading = false
    page._videoRecoveryStartPosition = null
    page._currentPosition = 80
    page._pendingVideoResume = null
    return page
  }

  function videoFailToasts() {
    return toasts.filter((title) => title && String(title).includes('视频播放失败'))
  }

  async function assertReloadEntersRetryableError(handler, label) {
    getHandler = handler
    const page = createVideoPage()
    const failBefore = videoFailToasts().length
    const ok = await page.onVideoError()
    assert.strictEqual(ok, false, label + ' 应返回失败')
    assert.strictEqual(page.data.videoFailed, true, label + ' 必须进入 videoFailed')
    assert.strictEqual(page._videoReloading, false, label + ' 必须释放重载锁')
    assert.strictEqual(page.data.videoUrl, 'https://cdn.example/old.mp4')
    assert.strictEqual(resolvePlayerStage(page.data), 'videoFailed', label + ' 舞台应对应重新加载')
    assert.ok(videoFailToasts().length > failBefore, label + ' 应提示播放失败')
    const playGet = gets.filter((item) => String(item.url).includes('/courses/7/play')).at(-1)
    assert.strictEqual(playGet.options && playGet.options.silent, true)
    return page
  }

  const rejectedPage = await assertReloadEntersRetryableError(
    () => Promise.reject(new Error('network')),
    'play 接口拒绝'
  )
  getHandler = () => Promise.resolve({ videoUrl: 'https://cdn.example/new.mp4' })
  const retried = await rejectedPage.onRetryVideo()
  assert.strictEqual(retried, true)
  assert.strictEqual(rejectedPage.data.videoFailed, false)
  assert.strictEqual(rejectedPage.data.videoUrl, 'https://cdn.example/new.mp4')
  assert.strictEqual(rejectedPage._videoReloading, false)
  assert.deepStrictEqual(rejectedPage._pendingVideoResume, { position: 80, playing: true })
  assert.ok(toasts.includes('已刷新视频地址'))

  await assertReloadEntersRetryableError(() => Promise.resolve({}), 'play 返回空对象')
  await assertReloadEntersRetryableError(() => Promise.resolve({ videoUrl: '' }), 'play 返回空地址')

  getHandler = () => Promise.resolve({ videoUrl: 'https://cdn.example/recovered.mp4' })
  const autoOk = createVideoPage()
  const failBeforeAutoOk = videoFailToasts().length
  const successBeforeAutoOk = toasts.filter((title) => title === '已刷新视频地址').length
  const autoOkResult = await autoOk.onVideoError()
  assert.strictEqual(autoOkResult, true)
  assert.strictEqual(autoOk.data.videoFailed, false)
  assert.strictEqual(autoOk.data.videoUrl, 'https://cdn.example/recovered.mp4')
  assert.strictEqual(videoFailToasts().length, failBeforeAutoOk, '自动刷新成功不得弹失败 toast')
  assert.strictEqual(
    toasts.filter((title) => title === '已刷新视频地址').length,
    successBeforeAutoOk,
    '自动刷新成功不得弹“已刷新”'
  )

  getHandler = () => Promise.resolve({})

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
