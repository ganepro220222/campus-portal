/**
 * 列表页加载状态单测
 * 运行：node miniapp/utils/feedListPage.test.js
 */
const assert = require('assert')
const {
  buildFeedLoadingPatch,
  buildFeedLoadedPatch,
  buildFeedFailurePatch,
  shouldShowFeedLoadError,
  shouldShowFeedRefreshBar
} = require('./feedListPage')

assert.deepStrictEqual(buildFeedLoadingPatch(true), {
  loading: true,
  loadingMore: false,
  error: false,
  refreshError: false
})
assert.deepStrictEqual(buildFeedLoadingPatch(false), { loadingMore: true })

const loaded = buildFeedLoadedPatch('newsList', [{ id: 1 }], 2, true)
assert.strictEqual(loaded.newsList.length, 1)
assert.strictEqual(loaded.page, 2)
assert.strictEqual(loaded.error, false)

const initialFail = buildFeedFailurePatch(new Error('network'), { newsList: [] }, 'newsList')
assert.strictEqual(initialFail.error, true)
assert.deepStrictEqual(initialFail.newsList, [])

const silentFail = buildFeedFailurePatch(new Error('network'), { newsList: [{ id: 1 }] }, 'newsList')
assert.strictEqual(silentFail.refreshError, true)

assert.strictEqual(shouldShowFeedLoadError(true, false, 0), true)
assert.strictEqual(shouldShowFeedLoadError(true, true, 0), false)
assert.strictEqual(shouldShowFeedRefreshBar(true, false, 2), true)

console.log('[feedListPage.test] PASS')
