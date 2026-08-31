/**
 * 资料按 4MB 上限从签名 CDN 顺序请求、顺序落盘，失败后从当前偏移回退 API。
 * 运行：node miniapp/utils/resourceChunk.test.js
 */
const assert = require('assert')
const {
  _fetchViaChunkApi,
  _fetchViaPreferredChunks,
  FILE_CHUNK_BYTES
} = require('./resourceDownload')

const originalWx = global.wx
let savedBytes = []
let unlinked = false
const progress = []

function bytes(buffer) {
  return Array.from(new Uint8Array(buffer))
}

function resetFsState() {
  savedBytes = []
  unlinked = false
  progress.length = 0
}

global.wx = {
  env: { USER_DATA_PATH: 'wxfile://usr' },
  showLoading(options) {
    progress.push(options.title)
  },
  getFileSystemManager() {
    return {
      writeFile(options) {
        savedBytes = bytes(options.data)
        options.success()
      },
      appendFile(options) {
        savedBytes.push(...bytes(options.data))
        options.success()
      },
      unlink(options) {
        unlinked = true
        options.complete()
      }
    }
  }
}

async function run() {
  resetFsState()
  const calls = []
  const downloader = async (url, data) => {
    calls.push({ url, ...data })
    const all = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const part = all.slice(data.offset, Math.min(data.offset + 4, all.length))
    return {
      data: new Uint8Array(part).buffer,
      header: { 'X-File-Size': String(all.length) },
      statusCode: 206
    }
  }

  const filePath = await _fetchViaChunkApi(9, 'pdf', downloader)

  assert.match(filePath, /^wxfile:\/\/usr\/res_\d+\.pdf$/)
  assert.deepStrictEqual(savedBytes, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  assert.deepStrictEqual(calls.map((item) => item.offset), [0, 4, 8])
  assert.ok(calls.every((item) => item.url === '/resources/9/file-chunks'))
  assert.ok(calls.every((item) => item.size === FILE_CHUNK_BYTES))
  assert.strictEqual(progress.at(-1), '下载 100%')
  assert.strictEqual(unlinked, false)

  const missingHeader = async () => ({
    data: new Uint8Array([1]).buffer,
    header: {},
    statusCode: 206
  })
  await assert.rejects(
    _fetchViaChunkApi(9, 'pdf', missingHeader),
    /chunk-total-missing/
  )
  assert.strictEqual(unlinked, true, '失败时应删除不完整文件')

  resetFsState()
  const sourceCalls = []
  const unexpectedApiCalls = []
  const all = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  const signedSourceDownloader = async (url, offset, size) => {
    sourceCalls.push({ url, offset, size })
    const part = all.slice(offset, Math.min(offset + 4, all.length))
    return {
      data: new Uint8Array(part).buffer,
      header: {
        'Content-Range': `bytes ${offset}-${offset + part.length - 1}/${all.length}`
      },
      statusCode: 206
    }
  }
  const unexpectedApiDownloader = async (url, data) => {
    unexpectedApiCalls.push({ url, ...data })
    throw new Error('api-should-not-run')
  }
  const sourceUrl = 'https://cdn.yunmanvr.com/files/document.docx?auth_key=secret'
  const sourcePath = await _fetchViaPreferredChunks(
    sourceUrl,
    9,
    'docx',
    signedSourceDownloader,
    unexpectedApiDownloader
  )
  assert.match(sourcePath, /^wxfile:\/\/usr\/res_\d+\.docx$/)
  assert.deepStrictEqual(savedBytes, all)
  assert.deepStrictEqual(sourceCalls.map((item) => item.offset), [0, 4, 8])
  assert.ok(sourceCalls.every((item) => item.url === sourceUrl))
  assert.ok(sourceCalls.every((item) => item.size === FILE_CHUNK_BYTES))
  assert.deepStrictEqual(unexpectedApiCalls, [], '签名 CDN 正常时不得经过 ECS')
  assert.strictEqual(progress.at(-1), '下载 100%')

  resetFsState()
  const fallbackSourceOffsets = []
  const fallbackApiOffsets = []
  const failsAfterFirstChunk = async (url, offset) => {
    fallbackSourceOffsets.push(offset)
    if (offset > 0) throw new Error('source-timeout')
    const part = all.slice(0, 4)
    return {
      data: new Uint8Array(part).buffer,
      header: { 'Content-Range': `bytes 0-3/${all.length}` },
      statusCode: 206
    }
  }
  const fallbackApiDownloader = async (url, data) => {
    fallbackApiOffsets.push(data.offset)
    const part = all.slice(data.offset, Math.min(data.offset + 4, all.length))
    return {
      data: new Uint8Array(part).buffer,
      header: { 'X-File-Size': String(all.length) },
      statusCode: 206
    }
  }
  await _fetchViaPreferredChunks(
    sourceUrl,
    9,
    'pptx',
    failsAfterFirstChunk,
    fallbackApiDownloader
  )
  assert.deepStrictEqual(savedBytes, all)
  assert.deepStrictEqual(fallbackSourceOffsets, [0, 4, 4], 'CDN 分块失败应重试一次')
  assert.deepStrictEqual(fallbackApiOffsets, [4, 8], 'ECS 应从失败偏移续传而非重新下载')
  assert.strictEqual(unlinked, false)

  console.log('[resourceChunk.test] PASS')
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    global.wx = originalWx
  })
