/**
 * 个人中心列表页视图状态单测
 * 运行：node miniapp/utils/profileListPage.test.js
 */
const assert = require('assert')
const {
  buildLoadedViewState,
  buildErrorViewState,
  shouldShowBusinessEmpty,
  shouldShowLoadError,
  normalizeProfileList
} = require('./profileListPage')

const emptyFavorites = buildLoadedViewState('favorites', [])
assert.strictEqual(emptyFavorites.isEmpty, true)
assert.strictEqual(emptyFavorites.error, false)
assert.strictEqual(emptyFavorites.loading, false)
assert.deepStrictEqual(emptyFavorites.list, [])

const withFavorites = buildLoadedViewState('favorites', [{
  id: 1,
  title: '测试',
  targetTypeLabel: '动态'
}])
assert.strictEqual(withFavorites.isEmpty, false)
assert.strictEqual(withFavorites.list[0].subtitle, '动态')

const emptyFootprints = buildLoadedViewState('footprints', [])
assert.strictEqual(emptyFootprints.isEmpty, true)
assert.deepStrictEqual(emptyFootprints.timelineGroups, [])

const enrollItem = normalizeProfileList('enrolls', [{
  id: 9,
  activityTitle: '讲座',
  activityLocation: 'A101',
  status: 'approved',
  activityId: 3
}])[0]
assert.strictEqual(enrollItem.title, '讲座')
assert.strictEqual(enrollItem.route, '/packageC/activity/detail?id=3')

const initialError = buildErrorViewState({ list: [], timelineGroups: [] })
assert.strictEqual(initialError.error, true)
assert.strictEqual(initialError.isEmpty, true)
assert.strictEqual(initialError.loading, false)

const refreshError = buildErrorViewState({
  list: [{ id: 1, title: '保留' }],
  timelineGroups: []
})
assert.strictEqual(refreshError.error, true)
assert.strictEqual(refreshError.isEmpty, false)

assert.strictEqual(shouldShowBusinessEmpty(true, false), true)
assert.strictEqual(shouldShowBusinessEmpty(true, true), false)
assert.strictEqual(shouldShowLoadError(true, false), true)
assert.strictEqual(shouldShowLoadError(true, true), false)

console.log('[profileListPage.test] PASS')
