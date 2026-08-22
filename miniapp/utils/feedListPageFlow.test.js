/**
 * 列表页控制流单测：下拉刷新保留旧内容、分类竞态、分页失败
 * 运行：node miniapp/utils/feedListPageFlow.test.js
 */
const assert = require('assert')
const {
  FEED_LOAD,
  normalizeFeedLoadOptions,
  buildFeedLoadingPatch,
  buildFeedLoadedPatch,
  buildFeedFailurePatch,
  prevForFeedFailure,
  bumpListGeneration,
  isStaleCategoryRequest,
  isStaleListRequest,
  shouldShowFeedLoadMoreBar
} = require('./feedListPage')
const { mergePageRecords } = require('./newsListPage')

function createCategoryPage() {
  return {
    _listGeneration: 0,
    data: {
      activeCat: 0,
      hallList: [{ id: 'seed' }]
    },
    patches: [],
    setData(patch) {
      this.patches.push(patch)
      Object.assign(this.data, patch)
    }
  }
}

// --- 下拉刷新失败：保留旧列表 + refreshError ---
;(function testPullRefreshFailurePreservesList() {
  const page = createCategoryPage()
  const prev = { ...page.data }
  page.setData(buildFeedLoadingPatch(FEED_LOAD.pullRefresh, prev, 'hallList'))
  assert.strictEqual(page.data.hallList.length, 1)

  page.setData(buildFeedFailurePatch(
    new Error('timeout'),
    prevForFeedFailure(FEED_LOAD.pullRefresh, prev, 'hallList'),
    'hallList',
    FEED_LOAD.pullRefresh
  ))
  assert.strictEqual(page.data.hallList.length, 1)
  assert.strictEqual(page.data.refreshError, true)
  assert.ok(!page.data.error)
})()

// --- 加载下一页失败：保留列表 + loadMoreError（非 refreshError）---
;(function testLoadMoreFailureUsesBottomState() {
  const state = {
    newsList: [{ id: 1 }, { id: 2 }],
    page: 2,
    hasMore: true,
    loadingMore: true
  }
  const prev = { ...state }
  const failPatch = buildFeedFailurePatch(
    new Error('timeout'),
    prevForFeedFailure(FEED_LOAD.loadMore, prev, 'newsList'),
    'newsList',
    FEED_LOAD.loadMore
  )
  Object.assign(state, failPatch)
  assert.strictEqual(state.newsList.length, 2)
  assert.strictEqual(state.page, 2)
  assert.strictEqual(state.loadMoreError, true)
  assert.strictEqual(state.refreshError, false)
  assert.strictEqual(
    shouldShowFeedLoadMoreBar(state.loadMoreError, state.loadingMore, state.newsList.length, state.hasMore),
    true
  )
})()

// --- 分页失败重试仍请求原页码并 append ---
;(function testLoadMoreRetryKeepsPageAndAppends() {
  const pageState = {
    newsList: [{ id: 'p1-1' }],
    page: 2,
    hasMore: true,
    loadMoreError: true
  }

  const loadOpts = normalizeFeedLoadOptions(FEED_LOAD.loadMore)
  assert.strictEqual(loadOpts.replaceOnSuccess, false)
  const requestPage = loadOpts.replaceOnSuccess ? 1 : pageState.page
  assert.strictEqual(requestPage, 2)

  pageState.loadMoreError = false
  const page2Records = [{ id: 'p2-1' }]
  const merged = mergePageRecords(pageState.newsList, page2Records, false)
  const loaded = buildFeedLoadedPatch('newsList', merged, requestPage + 1, true)
  Object.assign(pageState, loaded)

  assert.strictEqual(pageState.newsList.length, 2)
  assert.strictEqual(pageState.newsList[1].id, 'p2-1')
  assert.strictEqual(pageState.page, 3)
  assert.strictEqual(pageState.loadMoreError, false)
})()

// --- 下拉刷新重试仍从第一页 replace ---
;(function testPullRefreshRetryResetsToPageOne() {
  const loadOpts = normalizeFeedLoadOptions(FEED_LOAD.pullRefresh)
  const requestPage = loadOpts.replaceOnSuccess ? 1 : 3
  assert.strictEqual(requestPage, 1)
  const merged = mergePageRecords([], [{ id: 'fresh' }], true)
  assert.strictEqual(merged.length, 1)
  assert.strictEqual(merged[0].id, 'fresh')
})()

// --- 首次加载失败：清空并全屏错误 ---
;(function testInitialFailureClearsList() {
  const page = createCategoryPage()
  page.data.hallList = []
  const prev = { ...page.data }
  page.setData(buildFeedFailurePatch(
    new Error('timeout'),
    prevForFeedFailure(FEED_LOAD.initial, prev, 'hallList'),
    'hallList',
    FEED_LOAD.initial
  ))
  assert.deepStrictEqual(page.data.hallList, [])
  assert.strictEqual(page.data.error, true)
})()

// --- 分类切换：开始时清空旧分类 ---
;(function testCategorySwitchClearsOnStart() {
  const page = createCategoryPage()
  page.setData(buildFeedLoadingPatch(FEED_LOAD.categorySwitch, page.data, 'hallList'))
  assert.deepStrictEqual(page.data.hallList, [])
})()

// --- 竞态：B 先返回、A 后返回，最终必须是 B ---
;(async function testCategoryRaceDiscardsStaleResponse() {
  const page = createCategoryPage()

  const genA = bumpListGeneration(page)
  const catA = 0

  page.data.activeCat = 1
  const genB = bumpListGeneration(page)
  const catB = 1

  const applyIfFresh = (generation, catIndex, list) => {
    if (isStaleCategoryRequest(page, generation, catIndex)) return
    page.setData({ hallList: list })
  }

  applyIfFresh(genB, catB, [{ id: 'B' }])
  applyIfFresh(genA, catA, [{ id: 'A' }])

  assert.strictEqual(page.data.activeCat, 1)
  assert.strictEqual(page.data.hallList[0].id, 'B')
})()

// --- 分类切换后旧分页错误不得残留 ---
;(function testCategorySwitchClearsLoadMoreError() {
  const loaded = buildFeedLoadedPatch('newsList', [{ id: 1 }], 2, true)
  assert.strictEqual(loaded.loadMoreError, false)
})()

// --- 无分类列表：过期 generation 不写入 ---
;(async function testListGenerationStale() {
  const page = { _listGeneration: 0, data: { activityList: [{ id: 1 }] }, setData(p) { Object.assign(this.data, p) } }
  const g1 = bumpListGeneration(page)
  const g2 = bumpListGeneration(page)

  const apply = (generation, list) => {
    if (isStaleListRequest(page, generation)) return
    page.setData({ activityList: list })
  }

  apply(g2, [{ id: 'new' }])
  apply(g1, [{ id: 'stale' }])

  assert.strictEqual(page.data.activityList[0].id, 'new')
})()

console.log('[feedListPageFlow.test] PASS')
