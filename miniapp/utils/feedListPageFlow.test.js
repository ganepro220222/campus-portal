/**
 * 列表页控制流单测：下拉刷新保留旧内容、分类竞态丢弃过期响应
 * 运行：node miniapp/utils/feedListPageFlow.test.js
 */
const assert = require('assert')
const {
  FEED_LOAD,
  buildFeedLoadingPatch,
  buildFeedFailurePatch,
  prevForFeedFailure,
  bumpListGeneration,
  isStaleCategoryRequest,
  isStaleListRequest
} = require('./feedListPage')

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
    'hallList'
  ))
  assert.strictEqual(page.data.hallList.length, 1)
  assert.strictEqual(page.data.refreshError, true)
  assert.ok(!page.data.error)
})()

// --- 首次加载失败：清空并全屏错误 ---
;(function testInitialFailureClearsList() {
  const page = createCategoryPage()
  page.data.hallList = []
  const prev = { ...page.data }
  page.setData(buildFeedFailurePatch(
    new Error('timeout'),
    prevForFeedFailure(FEED_LOAD.initial, prev, 'hallList'),
    'hallList'
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
