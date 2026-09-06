/**
 * 下载确认：打开/播放失败不得记账；previewMedia 失败不得 complete。
 * 运行：node miniapp/utils/resourceDownloadConfirm.test.js
 */
const assert = require('assert')

const requestPath = require.resolve('./request')
const authPath = require.resolve('./auth')
const resourcePath = require.resolve('./resourceDownload')
const originalRequestCache = require.cache[requestPath]
const originalAuthCache = require.cache[authPath]
const originalResourceCache = require.cache[resourcePath]
const originalWx = global.wx

const posts = []
const pendingPosts = []
const toasts = []

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

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve))
}

async function run() {
  global.wx = {
    showToast(options) {
      toasts.push(options.title)
    },
    previewMedia(options) {
      if (options.sources[0].url.includes('fail')) {
        options.fail({ errMsg: 'previewMedia:fail' })
        return
      }
      options.success()
    }
  }

  const {
    downloadResource,
    _resetActiveDownloadState
  } = require('./resourceDownload')
  _resetActiveDownloadState()

  let recorded = 0
  downloadResource(3, { onRecorded: () => { recorded += 1 } })
  pendingPosts[0].resolve({
    fileUrl: 'https://cdn.yunmanvr.com/videos/fail.mp4',
    fileType: 'mp4',
    name: '坏视频',
    token: 'a'.repeat(32)
  })
  await flushPromises()
  await flushPromises()
  assert.strictEqual(posts.length, 1, 'previewMedia 失败不得确认记账')
  assert.strictEqual(recorded, 0)

  downloadResource(4, { onRecorded: () => { recorded += 1 } })
  pendingPosts[1].resolve({
    fileUrl: 'https://cdn.yunmanvr.com/videos/ok.mp4',
    fileType: 'mp4',
    name: '好视频',
    token: 'b'.repeat(32)
  })
  await flushPromises()
  await flushPromises()
  assert.strictEqual(posts.length, 3)
  assert.match(posts[2].url, /\/resources\/4\/download-complete$/)
  pendingPosts[2].reject(new Error('network'))
  await flushPromises()
  await flushPromises()
  assert.strictEqual(posts.length, 4, '确认失败应再用同一 token 重试一次')
  assert.match(posts[3].url, /\/resources\/4\/download-complete$/)
  pendingPosts[3].reject(new Error('network'))
  await flushPromises()
  await flushPromises()
  assert.strictEqual(recorded, 0, '确认失败不得把列表次数加一')
  assert.ok(toasts.includes('文件已打开，但下载记录同步失败'))

  downloadResource(5, { onRecorded: () => { recorded += 1 } })
  pendingPosts[4].resolve({
    fileUrl: 'https://cdn.yunmanvr.com/videos/ok2.mp4',
    fileType: 'mp4',
    name: '好视频2',
    token: 'c'.repeat(32)
  })
  await flushPromises()
  await flushPromises()
  pendingPosts[5].reject(new Error('network'))
  await flushPromises()
  await flushPromises()
  pendingPosts[6].resolve({ recorded: true })
  await flushPromises()
  await flushPromises()
  assert.strictEqual(recorded, 1, '第一次确认失败、重试成功应记账')

  console.log('[resourceDownloadConfirm.test] PASS')
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
