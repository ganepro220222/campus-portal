/**
 * 首页失败分层与缓存合并
 * 运行：node miniapp/utils/homePageLoad.test.js
 */
const assert = require('assert')
const {
  allContentFailed,
  shouldShowHomeError,
  shouldShowHomeRefreshError,
  mergeHomeCache,
  hasCacheableHomeData,
  viewListsFromHomeCache,
  resolveHomeSection
} = require('./homePageLoad')

assert.strictEqual(allContentFailed({ banners: false, recommends: false, colleges: false }), true)
assert.strictEqual(allContentFailed({ banners: true, recommends: false, colleges: false }), false)

assert.strictEqual(shouldShowHomeError(false, { banners: false, recommends: false, colleges: false }), true)
assert.strictEqual(shouldShowHomeError(true, { banners: false, recommends: false, colleges: false }), false)
assert.strictEqual(shouldShowHomeError(false, { banners: true, recommends: false, colleges: false }), false)

assert.strictEqual(shouldShowHomeRefreshError(true, { banners: false, recommends: true, colleges: true }), true)
assert.strictEqual(shouldShowHomeRefreshError(false, { banners: false, recommends: true, colleges: true }), false)
assert.strictEqual(shouldShowHomeRefreshError(true, { banners: true, recommends: true, colleges: true }), false)
assert.strictEqual(shouldShowHomeRefreshError(true, { banners: false, recommends: false, colleges: false }), true, '有缓存时全失败走刷新条而不是整页错误')

const prev = {
  banners: [{ id: 1 }],
  hallList: [{ id: 2 }],
  newsList: [{ id: 3 }],
  courseList: [{ id: 4 }],
  collegeList: [{ id: 5 }],
  collegeHome: [{ id: 5 }],
  navEntries: [{ id: 9 }]
}
const next = {
  banners: [{ id: 11 }],
  hallList: [],
  newsList: [],
  courseList: [],
  collegeList: [{ id: 15 }],
  collegeHome: [{ id: 15 }],
  navEntries: [{ id: 19 }]
}

const mergedPartial = mergeHomeCache(prev, next, {
  banners: false,
  recommends: true,
  colleges: false,
  navItems: false
})
assert.deepStrictEqual(mergedPartial.banners, [{ id: 11 }])
assert.deepStrictEqual(mergedPartial.hallList, [{ id: 2 }], 'recommends 失败保留上次展馆')
assert.deepStrictEqual(mergedPartial.collegeList, [{ id: 15 }])
assert.deepStrictEqual(mergedPartial.navEntries, [{ id: 19 }])

const mergedFirstFailBanners = mergeHomeCache(null, {
  banners: [],
  hallList: [{ id: 2 }],
  newsList: [],
  courseList: [],
  collegeList: [],
  collegeHome: [],
  navEntries: [{ id: 9 }]
}, { banners: true, recommends: false, colleges: false, navItems: false })
assert.strictEqual(Object.prototype.hasOwnProperty.call(mergedFirstFailBanners, 'banners'), false, '无上次数据的失败栏不写缓存')
assert.deepStrictEqual(mergedFirstFailBanners.hallList, [{ id: 2 }])
assert.ok(hasCacheableHomeData(mergedFirstFailBanners))
assert.ok(!hasCacheableHomeData({ navEntries: [{ id: 1 }] }))

const view = viewListsFromHomeCache(mergedFirstFailBanners, [{ id: 'def' }])
assert.deepStrictEqual(view.banners, [])
assert.deepStrictEqual(view.hallList, [{ id: 2 }])

assert.deepStrictEqual(resolveHomeSection(false, [{ id: 1 }], [{ id: 9 }]), [{ id: 1 }])
assert.deepStrictEqual(resolveHomeSection(true, [], [{ id: 9 }]), [{ id: 9 }])
assert.deepStrictEqual(resolveHomeSection(true, [], null), [])

console.log('[homePageLoad.test] PASS')
