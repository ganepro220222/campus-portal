/**
 * 消息中心加载态：接口失败不得显示「暂无消息」
 * 运行：node miniapp/utils/messageCenterLoad.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {
  unreadCountFrom,
  buildMessageLoadingPatch,
  buildMessageLoadedPatch,
  buildMessageFailurePatch,
  shouldShowMessageEmpty
} = require('./messageCenterLoad')

const pageSrc = fs.readFileSync(path.join(__dirname, '../packageC/message/index.js'), 'utf8')
assert.doesNotMatch(pageSrc, /get\('\/messages'\)\.catch\(\(\) => \[\]\)/)
assert.match(pageSrc, /buildMessageFailurePatch/)
assert.match(pageSrc, /get\('\/profile\/stats'\)\.catch/)

const items = [
  { id: 1, readStatus: 0 },
  { id: 2, readStatus: 1 }
]
assert.strictEqual(unreadCountFrom(items, { unreadMessages: 9 }), 9)
assert.strictEqual(unreadCountFrom(items, null), 1)
assert.strictEqual(unreadCountFrom(items, {}), 1)

const firstLoad = buildMessageLoadingPatch(false)
assert.strictEqual(firstLoad.loading, true)
assert.strictEqual(firstLoad.error, false)
const refreshLoad = buildMessageLoadingPatch(true)
assert.strictEqual(refreshLoad.loading, false)
assert.strictEqual(refreshLoad.refreshError, false)

const loaded = buildMessageLoadedPatch(items, null)
assert.strictEqual(loaded.list.length, 2)
assert.strictEqual(loaded.unreadCount, 1)
assert.strictEqual(loaded.error, false)
assert.strictEqual(shouldShowMessageEmpty(loaded.loading, loaded.error, loaded.list.length), false)

const emptyOk = buildMessageLoadedPatch([], { unreadMessages: 0 })
assert.strictEqual(shouldShowMessageEmpty(emptyOk.loading, emptyOk.error, emptyOk.list.length), true)

const firstFail = buildMessageFailurePatch(false)
assert.strictEqual(firstFail.error, true)
assert.strictEqual(firstFail.refreshError, false)
assert.strictEqual(shouldShowMessageEmpty(firstFail.loading, firstFail.error, 0), false)

const refreshFail = buildMessageFailurePatch(true)
assert.strictEqual(refreshFail.error, false)
assert.strictEqual(refreshFail.refreshError, true)
assert.strictEqual(refreshFail.list, undefined)

console.log('messageCenterLoad.test: ok')
