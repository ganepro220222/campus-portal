/**
 * 音频报错或超时后，重试必须重新走 downloadResource：新签名 URL、新 ticket，
 * canplay/onPlay 成功后再 download-complete，且只记一次。
 * 运行：node miniapp/utils/resourceDownloadAudioRetry.test.js
 */
const assert = require('assert')

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
const playJobs = []
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
require.cache[playerPath] = {
  id: playerPath,
  filename: playerPath,
  loaded: true,
  exports: {
    play(opts) {
      return new Promise((resolve, reject) => {
        playJobs.push({ opts, resolve, reject })
      })
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
    }
  }

  const {
    downloadResource,
    _resetActiveDownloadState
  } = require('./resourceDownload')
  _resetActiveDownloadState()

  let recorded = 0
  downloadResource(8, { onRecorded: () => { recorded += 1 } })
  pendingPosts[0].resolve({
    fileUrl: 'https://cdn.yunmanvr.com/audios/old.mp3?auth_key=expired',
    fileType: 'mp3',
    name: '导览',
    token: 'a'.repeat(32)
  })
  await flushPromises()
  await flushPromises()
  assert.strictEqual(playJobs.length, 1)
  assert.strictEqual(playJobs[0].opts.url, 'https://cdn.yunmanvr.com/audios/old.mp3?auth_key=expired')
  playJobs[0].reject(new Error('audio-unplayable'))
  await flushPromises()
  await flushPromises()
  assert.strictEqual(posts.length, 1, '播放失败不得确认记账')
  assert.strictEqual(recorded, 0)

  playJobs[0].opts.onRetry()
  await flushPromises()
  await flushPromises()
  assert.strictEqual(posts.length, 2, '重试必须重新 POST /download 拿新 ticket')
  assert.match(posts[1].url, /\/resources\/8\/download$/)
  pendingPosts[1].resolve({
    fileUrl: 'https://cdn.yunmanvr.com/audios/new.mp3?auth_key=fresh',
    fileType: 'mp3',
    name: '导览',
    token: 'b'.repeat(32)
  })
  await flushPromises()
  await flushPromises()
  assert.strictEqual(playJobs.length, 2)
  assert.strictEqual(playJobs[1].opts.url, 'https://cdn.yunmanvr.com/audios/new.mp3?auth_key=fresh')
  playJobs[1].resolve()
  await flushPromises()
  await flushPromises()
  assert.strictEqual(posts.length, 3)
  assert.match(posts[2].url, /\/resources\/8\/download-complete$/)
  assert.deepStrictEqual(posts[2].body, { token: 'b'.repeat(32) })
  pendingPosts[2].resolve({ recorded: true })
  await flushPromises()
  await flushPromises()
  assert.strictEqual(recorded, 1, '重试成功后只记一次下载')

  playJobs[1].opts.onRetry()
  await flushPromises()
  await flushPromises()
  assert.strictEqual(posts.length, 4, '已记账后再重试必须再取新 ticket')
  assert.match(posts[3].url, /\/resources\/8\/download$/)
  pendingPosts[3].resolve({
    fileUrl: 'https://cdn.yunmanvr.com/audios/again.mp3?auth_key=third',
    fileType: 'mp3',
    name: '导览',
    token: 'c'.repeat(32)
  })
  await flushPromises()
  await flushPromises()
  assert.strictEqual(playJobs.length, 3)
  assert.strictEqual(playJobs[2].opts.url, 'https://cdn.yunmanvr.com/audios/again.mp3?auth_key=third')
  playJobs[2].resolve()
  await flushPromises()
  await flushPromises()
  assert.match(posts[4].url, /\/resources\/8\/download-complete$/)
  assert.deepStrictEqual(posts[4].body, { token: 'c'.repeat(32) })
  pendingPosts[4].resolve({ recorded: true })
  await flushPromises()
  await flushPromises()
  assert.strictEqual(recorded, 2, '开播后再次完整重试只多记这一次')

  console.log('[resourceDownloadAudioRetry.test] PASS')
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
