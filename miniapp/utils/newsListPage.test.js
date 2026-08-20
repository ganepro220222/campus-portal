/**
 * 动态列表分页单测
 * 运行：node miniapp/utils/newsListPage.test.js
 */
const assert = require('assert')
const {
  extractPageRecords,
  mergePageRecords,
  calcHasMore,
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
