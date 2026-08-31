/**
 * 大文档按 4MB 上限顺序请求、顺序落盘，整个文件不会同时进入 JS 内存。
 * 运行：node miniapp/utils/resourceChunk.test.js
 */
const assert = require('assert')
const {
  _fetchViaChunkApi,
  FILE_CHUNK_BYTES
} = require('./resourceDownload')

const originalWx = global.wx
let savedBytes = []
let unlinked = false
const progress = []

function bytes(buffer) {
  return Array.from(new Uint8Array(buffer))
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
