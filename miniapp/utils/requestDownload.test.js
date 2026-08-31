/**
 * 资料 downloadFile 必须使用微信临时目录；指定 USER_DATA_PATH 会让大文件长期占用持久配额。
 * 运行：node miniapp/utils/requestDownload.test.js
 */
const assert = require('assert')
const request = require('./request')

const originalWx = global.wx
const originalGetApp = global.getApp
let captured = null

global.getApp = () => ({
  globalData: {
    baseUrl: 'https://api.yunmanvr.com/api/v1',
    token: 'member-token'
  }
})
global.wx = {
  getStorageSync: () => '',
  downloadFile(payload) {
    captured = payload
    payload.success({ statusCode: 200, tempFilePath: 'wxfile://tmp/document' })
  }
}

async function run() {
  const path = await request.downloadToTempFile(
    '/resources/1/file/document.pdf',
    { ext: 'pdf' }
  )
  assert.strictEqual(path, 'wxfile://tmp/document')
  assert.strictEqual(
    captured.url,
    'https://api.yunmanvr.com/api/v1/resources/1/file/document.pdf'
  )
  assert.deepStrictEqual(captured.header, { Authorization: 'Bearer member-token' })
  assert.strictEqual(
    Object.prototype.hasOwnProperty.call(captured, 'filePath'),
    false,
    '预览下载不得写入 USER_DATA_PATH'
  )

  await request.downloadToTempFile(
    '/resources/1/file/document.pdf',
    { ext: 'pdf', auth: 'query' }
  )
  assert.match(captured.url, /\?access_token=member-token$/)
  assert.strictEqual(Object.prototype.hasOwnProperty.call(captured, 'header'), false)
  assert.strictEqual(Object.prototype.hasOwnProperty.call(captured, 'filePath'), false)

  console.log('[requestDownload.test] PASS')
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
