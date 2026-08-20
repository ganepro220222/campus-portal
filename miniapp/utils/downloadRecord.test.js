/**
 * 下载记录映射单测
 * 运行：node miniapp/utils/downloadRecord.test.js
 */
const assert = require('assert')
const { canRedownload, mapDownloadRecordItem } = require('./downloadRecord')

assert.strictEqual(canRedownload({ resourceId: 1, fileType: 'pdf' }), true)
assert.strictEqual(canRedownload({ resourceId: 1, fileType: '' }), false)
assert.strictEqual(canRedownload({ resourceId: null, fileType: 'pdf' }), false)

const ok = mapDownloadRecordItem({
  id: 9,
  resourceId: 3,
  fileName: '讲义.pdf',
  downloadedAt: '2026-08-20 10:00',
  fileType: 'pdf'
})
assert.strictEqual(ok.title, '讲义.pdf')
assert.strictEqual(ok.canRedownload, true)
assert.strictEqual(ok.subtitle, 'PDF')

const gone = mapDownloadRecordItem({
  id: 10,
  resourceId: 4,
  fileName: '旧文件.doc',
  downloadedAt: '2026-08-19 09:00',
  fileType: ''
})
assert.strictEqual(gone.canRedownload, false)
assert.strictEqual(gone.statusLabel, '已失效')
assert.strictEqual(gone.subtitle, '资源已下架')

console.log('[downloadRecord.test] PASS')
