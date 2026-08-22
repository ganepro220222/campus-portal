/**
 * 列表页加载状态单测
 * 运行：node miniapp/utils/feedListPage.test.js
 */
const assert = require('assert')
const {
  FEED_LOAD,
  normalizeFeedLoadOptions,
  buildFeedLoadingPatch,
  buildFeedLoadedPatch,
  buildFeedFailurePatch,
  prevForFeedFailure,
  resolveFeedRetryMode,
  bumpListGeneration,
  isStaleListRequest,
  isStaleCategoryRequest,
  shouldShowFeedLoadError,
  shouldShowFeedRefreshBar,
  shouldShowFeedLoadMoreBar
} = require('./feedListPage')

assert.deepStrictEqual(normalizeFeedLoadOptions(true), FEED_LOAD.initial)
assert.deepStrictEqual(normalizeFeedLoadOptions(false), FEED_LOAD.loadMore)
assert.deepStrictEqual(normalizeFeedLoadOptions('pullRefresh'), FEED_LOAD.pullRefresh)

const prevWithList = { newsList: [{ id: 1 }], loading: false }

const initialLoad = buildFeedLoadingPatch(FEED_LOAD.initial)
assert.strictEqual(initialLoad.loading, true)
assert.strictEqual(initialLoad.loadMoreError, false)

const pullLoad = buildFeedLoadingPatch(FEED_LOAD.pullRefresh, prevWithList, 'newsList')
assert.strictEqual(pullLoad.loading, false)
assert.strictEqual(pullLoad.newsList, undefined)

const catLoad = buildFeedLoadingPatch(FEED_LOAD.categorySwitch, prevWithList, 'hallList')
assert.deepStrictEqual(catLoad.hallList, [])
assert.strictEqual(catLoad.loading, true)

assert.deepStrictEqual(buildFeedLoadingPatch(FEED_LOAD.loadMore), {
  loadingMore: true,
  error: false,
  refreshError: false,
  loadMoreError: false
})

const loaded = buildFeedLoadedPatch('newsList', [{ id: 1 }], 2, true)
assert.strictEqual(loaded.newsList.length, 1)
assert.strictEqual(loaded.page, 2)
assert.strictEqual(loaded.loadMoreError, false)

const initialFail = buildFeedFailurePatch(
  new Error('network'),
  prevForFeedFailure(FEED_LOAD.initial, prevWithList, 'newsList'),
  'newsList',
  FEED_LOAD.initial
)
assert.strictEqual(initialFail.error, true)
assert.deepStrictEqual(initialFail.newsList, [])

const pullFail = buildFeedFailurePatch(
  new Error('network'),
  prevForFeedFailure(FEED_LOAD.pullRefresh, prevWithList, 'newsList'),
  'newsList',
  FEED_LOAD.pullRefresh
)
assert.strictEqual(pullFail.refreshError, true)
assert.strictEqual(pullFail.loadMoreError, false)

const loadMoreFail = buildFeedFailurePatch(
  new Error('network'),
  prevForFeedFailure(FEED_LOAD.loadMore, prevWithList, 'newsList'),
  'newsList',
  FEED_LOAD.loadMore
)
assert.strictEqual(loadMoreFail.loadMoreError, true)
assert.strictEqual(loadMoreFail.refreshError, false)

assert.deepStrictEqual(prevForFeedFailure(FEED_LOAD.pullRefresh, prevWithList, 'newsList'), prevWithList)
assert.deepStrictEqual(prevForFeedFailure(FEED_LOAD.initial, prevWithList, 'newsList'), { newsList: [] })

assert.deepStrictEqual(resolveFeedRetryMode(2), FEED_LOAD.pullRefresh)
assert.deepStrictEqual(resolveFeedRetryMode(0), FEED_LOAD.initial)

const page = { _listGeneration: 0, data: { activeCat: 0 } }
const g1 = bumpListGeneration(page)
const g2 = bumpListGeneration(page)
assert.strictEqual(g1, 1)
assert.strictEqual(g2, 2)
assert.strictEqual(isStaleListRequest(page, 1), true)
assert.strictEqual(isStaleCategoryRequest(page, 2, 0), false)
page.data.activeCat = 1
assert.strictEqual(isStaleCategoryRequest(page, 2, 0), true)

assert.strictEqual(shouldShowFeedLoadError(true, false, 0), true)
assert.strictEqual(shouldShowFeedRefreshBar(true, false, 2), true)
assert.strictEqual(shouldShowFeedLoadMoreBar(true, false, 3, true), true)
assert.strictEqual(shouldShowFeedLoadMoreBar(true, false, 3, false), false)

console.log('[feedListPage.test] PASS')
