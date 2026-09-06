/**
 * 离开页面或关闭播放栏时，pending /download 不得再打开媒体或记账。
 * 运行：node miniapp/utils/resourceDownloadCancel.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')

const requestPath = require.resolve('./request')
const authPath = require.resolve('./auth')
const playerPath = require.resolve('./resourceAudioPlayer')
const resourcePath = require.resolve('./resourceDownload')
const originalRequestCache = require.cache[requestPath]
const originalAuthCache = require.cache[authPath]
const originalPlayerCache = require.cache[playerPath]
const originalResourceCache = require.cache[resourcePath]
const originalWx = global.wx

const posts = []
const pendingPosts = []
const pendingChunks = []
const created = []
const previews = []
const openedDocs = []
const modals = []
const toasts = []

function createMockCtx(handlers) {
  const ctx = {
    obeyMuteSwitch: false,
    src: '',
    currentTime: 0,
    duration: 12,
    destroyed: false,
    playCount: 0,
    play() { ctx.playCount += 1 },
    pause() {},
    stop() {},
    destroy() { ctx.destroyed = true },
    onTimeUpdate() {},
    onCanplay(fn) { handlers.canplay = fn },
    onPlay(fn) { handlers.play = fn },
    onEnded(fn) { handlers.ended = fn },
    onStop(fn) { handlers.stop = fn },
    onError(fn) { handlers.error = fn }
  }
  return ctx
}

require.cache[requestPath] = {
  id: requestPath,
  filename: requestPath,
  loaded: true,
  exports: {
    post(url, body) {
      posts.push({ url, body })
      return new Promise((resolve, reject) => pendingPosts.push({ resolve, reject, url }))
    },
    getArrayBufferChunk() {
      return new Promise((resolve, reject) => pendingChunks.push({ resolve, reject, source: 'api' }))
    },
    getUrlArrayBufferChunk() {
      return new Promise((resolve, reject) => pendingChunks.push({ resolve, reject, source: 'signed' }))
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
delete require.cache[playerPath]
delete require.cache[resourcePath]

global.wx = {
  env: { USER_DATA_PATH: 'wxfile://usr' },
  showToast(options) {
    toasts.push(options && options.title)
  },
  showLoading() {},
  hideLoading() {},
  showModal(options) {
    modals.push(options && options.title)
    if (options && typeof options.success === 'function') {
      options.success({ confirm: false })
    }
  },
  setClipboardData() {},
  previewMedia(options) {
    previews.push(options.sources[0].url)
    if (typeof options.success === 'function') options.success()
  },
  openDocument(options) {
    openedDocs.push(options.filePath)
    if (typeof options.success === 'function') options.success()
  },
  downloadFile(options) {
    if (typeof options.fail === 'function') {
      options.fail(new Error('download-file-should-use-chunks'))
    }
    return { abort() {} }
  },
  createInnerAudioContext() {
    const handlers = {}
    const ctx = createMockCtx(handlers)
    created.push({ ctx, handlers })
    return ctx
  },
  getFileSystemManager() {
    return {
      readdir(options) {
        options.success({ files: [] })
      },
      writeFile(options) {
        options.success()
      },
      appendFile(options) {
        options.success()
      },
      unlink(options) {
        if (typeof options.complete === 'function') options.complete()
        else if (typeof options.success === 'function') options.success()
      }
    }
  }
}

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve))
}

async function flushTurns(times = 4) {
  for (let i = 0; i < times; i += 1) {
    await flushPromises()
  }
}

function lastPrepare() {
  return pendingPosts.filter((item) => /\/download$/.test(item.url)).at(-1)
}

function resolvePrepare(payload) {
  lastPrepare().resolve(payload)
}

function completePosts() {
  return posts.filter((item) => /download-complete$/.test(item.url))
}

;[
  '../packageB/resource/list.js',
  '../packageB/course/detail.js',
  '../packageC/profile/list.js'
].forEach((rel) => {
  const src = fs.readFileSync(path.join(__dirname, rel), 'utf8')
  assert.ok(src.includes('pausePageResourceSession'), `${rel} 离开前必须取消 pending 下载`)
  assert.ok(src.includes('destroyPageResourceSession'), `${rel} 卸载时必须取消 pending 下载`)
})

async function run() {
  const player = require('./resourceAudioPlayer')
  const {
    downloadResource,
    destroyPageResourceSession,
    pausePageResourceSession,
    _getActiveDownloadId,
    _resetActiveDownloadState
  } = require('./resourceDownload')
  _resetActiveDownloadState()

  let recorded = 0
  let completes = 0
  const taskA = downloadResource(8, {
    onRecorded: () => { recorded += 1 },
    onComplete: () => { completes += 1 }
  })
  assert.strictEqual(typeof taskA.cancel, 'function')
  assert.strictEqual(_getActiveDownloadId(), '8')
  assert.strictEqual(posts.length, 1)

  taskA.cancel()
  assert.strictEqual(taskA.cancelled, true)
  assert.strictEqual(_getActiveDownloadId(), null, '取消后必须立刻释放下载锁')
  assert.strictEqual(completes, 1)

  resolvePrepare({
    fileUrl: 'https://cdn.yunmanvr.com/audios/a.mp3?auth_key=a',
    fileType: 'mp3',
    name: '导览A',
    token: 'a'.repeat(32)
  })
  await flushTurns()
  assert.strictEqual(created.length, 0, 'cancel 后 prepare 返回不得创建音频 context')
  assert.strictEqual(player.snapshot().visible, false)
  assert.strictEqual(completePosts().length, 0, 'cancel 后不得调用 /download-complete')
  assert.strictEqual(recorded, 0, 'cancel 后不得调用 onRecorded')
  assert.strictEqual(completes, 1, 'cancel 后 onComplete 最多一次')

  let recordedB = 0
  downloadResource(9, {
    onRecorded: () => { recordedB += 1 }
  })
  assert.strictEqual(_getActiveDownloadId(), '9', 'A 取消后 B 应能立刻开始')
  resolvePrepare({
    fileUrl: 'https://cdn.yunmanvr.com/audios/b.mp3?auth_key=b',
    fileType: 'mp3',
    name: '导览B',
    token: 'b'.repeat(32)
  })
  await flushTurns()
  assert.strictEqual(created.length, 1)
  created[0].handlers.canplay()
  await flushTurns()
  assert.strictEqual(player.snapshot().id, '9')
  assert.strictEqual(player.snapshot().playing, true)
  assert.match(completePosts().at(-1).url, /\/resources\/9\/download-complete$/)
  pendingPosts.at(-1).resolve({ recorded: true })
  await flushTurns()
  assert.strictEqual(recorded, 0, 'A 被取消后不得再记账')
  assert.strictEqual(recordedB, 1, 'B 应独立确认一次')
  player.stop()
  await flushTurns()

  const createdBeforeUnload = created.length
  let recordedUnload = 0
  let completesUnload = 0
  downloadResource(11, {
    onRecorded: () => { recordedUnload += 1 },
    onComplete: () => { completesUnload += 1 }
  })
  destroyPageResourceSession()
  resolvePrepare({
    fileUrl: 'https://cdn.yunmanvr.com/audios/leave.mp3?auth_key=c',
    fileType: 'mp3',
    name: '离开页',
    token: 'c'.repeat(32)
  })
  await flushTurns()
  assert.strictEqual(created.length, createdBeforeUnload, '页面 onUnload 后不得再创建音频')
  assert.strictEqual(player.snapshot().visible, false)
  assert.strictEqual(player.snapshot().playing, false)
  assert.strictEqual(recordedUnload, 0)
  assert.strictEqual(completesUnload, 1)
  assert.ok(!completePosts().some((item) => /\/resources\/11\//.test(item.url)))

  const createdBeforeRetry = created.length
  let recordedRetry = 0
  downloadResource(12, {
    onRecorded: () => { recordedRetry += 1 }
  })
  resolvePrepare({
    fileUrl: 'https://cdn.yunmanvr.com/audios/retry.mp3?auth_key=d',
    fileType: 'mp3',
    name: '重试',
    token: 'd'.repeat(32)
  })
  await flushTurns()
  assert.strictEqual(created.length, createdBeforeRetry + 1)
  created.at(-1).handlers.error()
  await flushTurns()
  assert.ok(player.snapshot().error)
  player.retry()
  await flushTurns()
  assert.match(posts.at(-1).url, /\/resources\/12\/download$/)
  player.stop()
  resolvePrepare({
    fileUrl: 'https://cdn.yunmanvr.com/audios/retry-new.mp3?auth_key=e',
    fileType: 'mp3',
    name: '重试',
    token: 'e'.repeat(32)
  })
  await flushTurns()
  assert.strictEqual(created.length, createdBeforeRetry + 1, '关闭错误栏后重试响应不得再创建音频')
  assert.strictEqual(player.snapshot().visible, false)
  assert.strictEqual(recordedRetry, 0)
  assert.ok(!completePosts().some((item) => item.body && item.body.token === 'e'.repeat(32)))

  const previewCount = previews.length
  downloadResource(13)
  destroyPageResourceSession()
  resolvePrepare({
    fileUrl: 'https://cdn.yunmanvr.com/videos/leave.mp4?auth_key=f',
    fileType: 'mp4',
    name: '视频',
    token: 'f'.repeat(32)
  })
  await flushTurns()
  assert.strictEqual(previews.length, previewCount, '视频准备 pending 时离开不得 previewMedia')
  assert.ok(!completePosts().some((item) => /\/resources\/13\//.test(item.url)))

  const createdBeforeHide = created.length
  downloadResource(15)
  pausePageResourceSession()
  resolvePrepare({
    fileUrl: 'https://cdn.yunmanvr.com/audios/hide.mp3?auth_key=h',
    fileType: 'mp3',
    name: '隐藏页',
    token: 'h'.repeat(32)
  })
  await flushTurns()
  assert.strictEqual(created.length, createdBeforeHide, 'onHide 必须取消尚未返回的音频准备')
  assert.strictEqual(player.snapshot().visible, false)

  const previewBeforeProtect = previews.length
  downloadResource(16)
  resolvePrepare({
    fileUrl: 'https://cdn.yunmanvr.com/videos/preview.mp4?auth_key=i',
    fileType: 'mp4',
    name: '预览中',
    token: 'i'.repeat(32)
  })
  await flushTurns()
  assert.strictEqual(previews.length, previewBeforeProtect + 1, '视频预览应已打开')
  pausePageResourceSession()
  assert.match(posts.at(-1).url, /\/resources\/16\/download-complete$/)
  pendingPosts.at(-1).resolve({ recorded: true })
  await flushTurns()
  assert.strictEqual(_getActiveDownloadId(), null)

  const openedBefore = openedDocs.length
  const modalBefore = modals.length
  const chunkBefore = pendingChunks.length
  downloadResource(14)
  resolvePrepare({
    fileUrl: 'https://cdn.yunmanvr.com/files/leave.pdf?auth_key=g',
    fileType: 'pdf',
    name: '文档',
    token: 'g'.repeat(32)
  })
  await flushTurns()
  assert.ok(pendingChunks.length > chunkBefore, '文档应进入分块下载')
  destroyPageResourceSession()
  pendingChunks.at(-1).resolve({
    data: new Uint8Array([1, 2, 3, 4]).buffer,
    header: { 'Content-Range': 'bytes 0-3/8' },
    statusCode: 206
  })
  await flushTurns()
  assert.strictEqual(openedDocs.length, openedBefore, '文档分块 pending 时离开不得 openDocument')
  assert.strictEqual(modals.length, modalBefore, '取消不得弹出无法打开文件')
  assert.ok(!completePosts().some((item) => /\/resources\/14\//.test(item.url)))

  const openedBeforeHideDoc = openedDocs.length
  const chunkBeforeHideDoc = pendingChunks.length
  downloadResource(17)
  resolvePrepare({
    fileUrl: 'https://cdn.yunmanvr.com/files/hide.pdf?auth_key=j',
    fileType: 'pdf',
    name: '隐藏文档',
    token: 'j'.repeat(32)
  })
  await flushTurns()
  assert.ok(pendingChunks.length > chunkBeforeHideDoc)
  pausePageResourceSession()
  pendingChunks.at(-1).resolve({
    data: new Uint8Array([1, 2, 3, 4]).buffer,
    header: { 'Content-Range': 'bytes 0-3/8' },
    statusCode: 206
  })
  await flushTurns()
  assert.strictEqual(openedDocs.length, openedBeforeHideDoc, '文档分块时 onHide 不得 openDocument')
  assert.ok(!completePosts().some((item) => /\/resources\/17\//.test(item.url)))

  console.log('[resourceDownloadCancel.test] PASS')
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    global.wx = originalWx
    if (originalRequestCache) require.cache[requestPath] = originalRequestCache
    else delete require.cache[requestPath]
    if (originalAuthCache) require.cache[authPath] = originalAuthCache
    else delete require.cache[authPath]
    if (originalPlayerCache) require.cache[playerPath] = originalPlayerCache
    else delete require.cache[playerPath]
    if (originalResourceCache) require.cache[resourcePath] = originalResourceCache
    else delete require.cache[resourcePath]
  })
