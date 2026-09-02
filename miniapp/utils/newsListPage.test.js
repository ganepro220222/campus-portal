/**
 * 动态列表分页单测
 * 运行：node miniapp/utils/newsListPage.test.js
 */
const assert = require('assert')
const {
  extractPageRecords,
  mergePageRecords,
  calcHasMore,
  shouldRequestNextPage,
  buildLoadMoreFailurePatch,
  filterByCategory,
  sliceMockPage,
  mockHasMore
} = require('./newsListPage')

assert.deepStrictEqual(extractPageRecords({ records: [{ id: 1 }] }), [{ id: 1 }])
assert.deepStrictEqual(extractPageRecords([{ id: 2 }]), [{ id: 2 }])
assert.deepStrictEqual(extractPageRecords(null), [])

assert.deepStrictEqual(mergePageRecords([{ id: 1 }], [{ id: 2 }], false), [{ id: 1 }, { id: 2 }])
assert.deepStrictEqual(mergePageRecords([{ id: 1 }], [{ id: 2 }], true), [{ id: 2 }])

assert.strictEqual(calcHasMore(new Array(10), 10), true)
assert.strictEqual(calcHasMore(new Array(9), 10), false)

assert.strictEqual(shouldRequestNextPage({
  hasMore: true,
  loading: false,
  loadMoreError: false
}), true)
assert.strictEqual(shouldRequestNextPage({
  hasMore: true,
  loading: false,
  loadMoreError: true
}), false, '分页失败后触底不应自动重试')
assert.strictEqual(shouldRequestNextPage({
  hasMore: true,
  loading: false,
  loadMoreError: true
}, true), true, '分页失败后允许点击重试')
assert.strictEqual(shouldRequestNextPage({
  hasMore: true,
  loading: false,
  loadMoreError: false
}, true), false)
assert.strictEqual(shouldRequestNextPage({
  hasMore: true,
  loading: true,
  loadMoreError: true
}, true), false)
assert.strictEqual(shouldRequestNextPage({
  hasMore: false,
  loading: false,
  loadMoreError: true
}, true), false)

{
  const state = {
    newsList: [{ id: 1 }],
    page: 3,
    hasMore: true,
    loading: true,
    loadMoreError: false
  }
  const patch = buildLoadMoreFailurePatch()
  assert.strictEqual(Object.prototype.hasOwnProperty.call(patch, 'page'), false)
  assert.strictEqual(Object.prototype.hasOwnProperty.call(patch, 'hasMore'), false)
  Object.assign(state, patch)
  assert.strictEqual(state.page, 3, '分页失败后保留待重试页码')
  assert.strictEqual(state.hasMore, true, '分页失败后保留 hasMore')
  assert.strictEqual(state.loading, false)
  assert.strictEqual(state.loadMoreError, true)
}

const filtered = filterByCategory([
  { categoryName: '书院动态' },
  { categoryName: '活动通知' }
], '书院动态')
assert.strictEqual(filtered.length, 1)

assert.strictEqual(sliceMockPage([1, 2, 3, 4, 5], 2, 2).length, 2)
assert.strictEqual(sliceMockPage([1, 2, 3, 4, 5], 2, 2)[0], 3)
assert.strictEqual(mockHasMore([1, 2, 3, 4, 5], 1, 2), true)
assert.strictEqual(mockHasMore([1, 2, 3, 4, 5], 3, 2), false)

console.log('[newsListPage.test] PASS')
