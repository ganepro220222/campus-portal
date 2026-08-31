/**
 * 资料下载全局互斥：重复点击不得重复记下载，也不得并发启动另一份文档。
 * 运行：node miniapp/utils/resourceDownloadLock.test.js
 */
const assert = require('assert')

const requestPath = require.resolve('./request')
const authPath = require.resolve('./auth')
const resourcePath = require.resolve('./resourceDownload')
const originalRequestCache = require.cache[requestPath]
const originalAuthCache = require.cache[authPath]
const originalResourceCache = require.cache[resourcePath]
const originalWx = global.wx

let postCalls = 0
const pendingPosts = []
const toasts = []
const previews = []

require.cache[requestPath] = {
  id: requestPath,
  filename: requestPath,
  loaded: true,
  exports: {
    post() {
      postCalls += 1
      return new Promise((resolve) => pendingPosts.push(resolve))
    },
    getArrayBufferChunk() {
      throw new Error('unexpected API chunk')
    },
    getUrlArrayBufferChunk() {
      throw new Error('unexpected URL chunk')
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
delete require.cache[resourcePath]

global.wx = {
  showToast(options) {
    toasts.push(options.title)
  },
  previewMedia(options) {
    previews.push(options.sources[0].url)
  }
}

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve))
}

async function run() {
  const {
    downloadResource,
    _getActiveDownloadId,
    _resetActiveDownloadState
  } = require('./resourceDownload')
  _resetActiveDownloadState()

  let starts = 0
  let completes = 0
  downloadResource(9, {
    onStart: () => { starts += 1 },
    onComplete: () => { completes += 1 }
  })

  assert.strictEqual(postCalls, 1)
  assert.strictEqual(starts, 1)
  assert.strictEqual(_getActiveDownloadId(), '9')

  downloadResource(9)
  downloadResource(10)
  assert.strictEqual(postCalls, 1, '同一文件重复点击和另一文件并发都不得再发 POST')
  assert.deepStrictEqual(toasts, ['该文件正在下载', '已有文件正在下载'])

  pendingPosts[0]({
    fileUrl: 'https://cdn.yunmanvr.com/videos/a.mp4?auth_key=one',
    fileType: 'mp4',
    name: '视频'
  })
  await flushPromises()
  await flushPromises()

  assert.strictEqual(completes, 1)
  assert.strictEqual(_getActiveDownloadId(), null)
  assert.deepStrictEqual(previews, ['https://cdn.yunmanvr.com/videos/a.mp4?auth_key=one'])

  downloadResource(10)
  assert.strictEqual(postCalls, 2, '上一任务完成后应允许下一次下载')
  pendingPosts[1]({
    fileUrl: 'https://cdn.yunmanvr.com/audios/a.mp3?auth_key=two',
    fileType: 'mp4',
    name: '第二份'
  })
  await flushPromises()
  await flushPromises()
  assert.strictEqual(_getActiveDownloadId(), null)

  console.log('[resourceDownloadLock.test] PASS')
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
    if (originalResourceCache) require.cache[resourcePath] = originalResourceCache
    else delete require.cache[resourcePath]
  })
