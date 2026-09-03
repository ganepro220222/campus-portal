/**
 * 首页失败分层与缓存合并
 * 运行：node miniapp/utils/homePageLoad.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {
  allContentFailed,
  shouldShowHomeError,
  shouldShowHomeRefreshError,
  mergeHomeCache,
  hasCacheableHomeData,
  viewListsFromHomeCache,
  resolveHomeSection,
  buildAnnouncementLoadPatch
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

const firstOk = buildAnnouncementLoadPatch({
  previousAnnouncements: [],
  previousHasNew: false,
  list: [{ id: 1, content: '维护通知' }],
  failed: false
})
assert.deepStrictEqual(firstOk.announcements, [{ id: 1, content: '维护通知' }])
assert.strictEqual(firstOk.hasNewAnnouncement, true)
assert.strictEqual(firstOk.announcementError, false)

const secondFail = buildAnnouncementLoadPatch({
  previousAnnouncements: firstOk.announcements,
  previousHasNew: firstOk.hasNewAnnouncement,
  failed: true
})
assert.deepStrictEqual(secondFail.announcements, [{ id: 1, content: '维护通知' }], '第二次失败保留原公告')
assert.strictEqual(secondFail.hasNewAnnouncement, true)
assert.strictEqual(secondFail.announcementError, true)

const firstFail = buildAnnouncementLoadPatch({
  previousAnnouncements: [],
  previousHasNew: false,
  list: [],
  failed: true
})
assert.deepStrictEqual(firstFail.announcements, [])
assert.strictEqual(firstFail.hasNewAnnouncement, false)
assert.strictEqual(firstFail.announcementError, true, '首次失败立错误态，不伪装成没有公告')

const retried = buildAnnouncementLoadPatch({
  previousAnnouncements: secondFail.announcements,
  previousHasNew: true,
  list: [{ id: 2, content: '新公告' }],
  failed: false
})
assert.strictEqual(retried.announcementError, false)
assert.deepStrictEqual(retried.announcements, [{ id: 2, content: '新公告' }])
assert.strictEqual(retried.hasNewAnnouncement, true)

const realEmpty = buildAnnouncementLoadPatch({
  previousAnnouncements: firstOk.announcements,
  previousHasNew: true,
  list: [],
  failed: false
})
assert.deepStrictEqual(realEmpty.announcements, [])
assert.strictEqual(realEmpty.hasNewAnnouncement, false)
assert.strictEqual(realEmpty.announcementError, false)

const indexJs = fs.readFileSync(path.join(__dirname, '../pages/index/index.js'), 'utf8')
assert.match(indexJs, /buildAnnouncementLoadPatch/)
assert.doesNotMatch(indexJs, /announcements\/active'\)\.catch\(\(\) => \[\]\)/)

console.log('[homePageLoad.test] PASS')
