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
  shouldShowMessageEmpty,
  markMessageReadLocally,
  revertMessageReadLocally
} = require('./messageCenterLoad')

const pageSrc = fs.readFileSync(path.join(__dirname, '../packageC/message/index.js'), 'utf8')
const pageWxml = fs.readFileSync(path.join(__dirname, '../packageC/message/index.wxml'), 'utf8')
assert.match(pageWxml, /wx:if="\{\{item\.route\}\}"/)
assert.doesNotMatch(pageSrc, /get\('\/messages'\)\.catch\(\(\) => \[\]\)/)
assert.match(pageSrc, /buildMessageFailurePatch/)
assert.match(pageSrc, /get\('\/profile\/stats'\)\.catch/)
assert.match(pageSrc, /markMessageReadLocally/)
assert.match(pageSrc, /revertMessageReadLocally/)
assert.match(pageSrc, /silent:\s*true/)
assert.match(pageSrc, /已读状态同步失败/)
assert.match(pageSrc, /read-all[\s\S]*_bumpReadSyncGen/)
assert.doesNotMatch(pageSrc, /await put\(`\/messages\/\$\{id\}\/read`\)/)
assert.doesNotMatch(pageSrc, /list\.filter\(m => m\.readStatus === 0\)\.length/)

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

{
  const marked = markMessageReadLocally(
    [{ id: 1, readStatus: 0 }, { id: 2, readStatus: 1 }],
    9,
    1
  )
  assert.strictEqual(marked.changed, 1)
  assert.strictEqual(marked.list[0].readStatus, 1)
  assert.strictEqual(marked.unreadCount, 8, '总未读必须按 stats 递减，不能用当前页重算')
}

{
  const again = markMessageReadLocally(
    [{ id: 1, readStatus: 1 }],
    8,
    '1'
  )
  assert.strictEqual(again.changed, 0)
  assert.strictEqual(again.unreadCount, 8)
}

{
  const reverted = revertMessageReadLocally(
    [{ id: 1, readStatus: 1 }, { id: 2, readStatus: 1 }],
    8,
    1
  )
  assert.strictEqual(reverted.changed, 1)
  assert.strictEqual(reverted.list[0].readStatus, 0)
  assert.strictEqual(reverted.unreadCount, 9)
  const noop = revertMessageReadLocally(reverted.list, reverted.unreadCount, 1)
  assert.strictEqual(noop.changed, 0)
  assert.strictEqual(noop.unreadCount, 9)
}

console.log('messageCenterLoad.test: ok')
