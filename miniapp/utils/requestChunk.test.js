/**
 * 资源分块必须走 wx.request + 206，不能接受旧后端误返回的整文件 200。
 * 运行：node miniapp/utils/requestChunk.test.js
 */
const assert = require('assert')
const request = require('./request')

const originalWx = global.wx
const originalGetApp = global.getApp
let captured = null
let responseStatus = 206

global.getApp = () => ({
  globalData: {
    baseUrl: 'https://api.yunmanvr.com/api/v1',
    token: 'member-token'
  }
})
global.wx = {
  getStorageSync: () => '',
  request(payload) {
    captured = payload
    payload.success({
      statusCode: responseStatus,
      data: new Uint8Array([1, 2, 3]).buffer,
      header: { 'X-File-Size': '10' }
    })
  }
}

async function run() {
  const result = await request.getArrayBufferChunk(
    '/resources/9/file-chunks',
    { offset: 4, size: 4 },
    { silent: true }
  )

  assert.strictEqual(captured.url, 'https://api.yunmanvr.com/api/v1/resources/9/file-chunks')
  assert.deepStrictEqual(captured.data, { offset: 4, size: 4 })
  assert.strictEqual(captured.responseType, 'arraybuffer')
  assert.deepStrictEqual(captured.header, { Authorization: 'Bearer member-token' })
  assert.strictEqual(result.statusCode, 206)
  assert.strictEqual(result.data.byteLength, 3)
  assert.strictEqual(result.header['X-File-Size'], '10')

  responseStatus = 200
  await assert.rejects(
    request.getArrayBufferChunk(
      '/resources/9/file-chunks',
      { offset: 0, size: 4 },
      { silent: true }
    ),
    /chunk-download-failed:200/
  )

  console.log('[requestChunk.test] PASS')
}

run()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => {
    global.wx = originalWx
    global.getApp = originalGetApp
  })
