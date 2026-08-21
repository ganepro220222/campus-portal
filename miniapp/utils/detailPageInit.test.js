/**
 * 活动详情页初始化状态单测
 * 运行：node miniapp/utils/detailPageInit.test.js
 */
const assert = require('assert')
const {
  buildDetailLoadedView,
  buildDetailInitialFailurePatch,
  buildDetailRefreshFailurePatch,
  buildDetailMissingIdPatch,
  resolveDetailOnLoad,
  buildDetailLoadingPatch,
  shouldRefreshDetailOnShow
} = require('./detailPageInit')

const activityRaw = {
  id: 5,
  title: '校园讲座',
  location: '报告厅',
  startTime: '2026-09-01 14:00',
  quota: 100,
  enrolledCount: 20,
  enrollStatus: 'none',
  canEnroll: true
}

const decorateDetail = (merged) => ({
  colorClass: 'hc2',
  coverImageMode: 'aspectFill'
})

const loaded = buildDetailLoadedView(activityRaw, 5, true, decorateDetail)
assert.strictEqual(loaded.loading, false)
assert.strictEqual(loaded.loadError, false)
assert.strictEqual(loaded.notFound, false)
assert.strictEqual(loaded.refreshError, false)
assert.strictEqual(loaded.detail.title, '校园讲座')
assert.strictEqual(loaded.detail.coverImageMode, 'aspectFill')
assert.strictEqual(loaded.coverClass, 'hc2')
assert.strictEqual(loaded.actionType, 'enroll')

const loadedGuest = buildDetailLoadedView(activityRaw, 5, false, decorateDetail)
assert.strictEqual(loadedGuest.actionType, 'login')

const networkFail = buildDetailInitialFailurePatch(new Error('network'))
assert.strictEqual(networkFail.loadError, true)
assert.strictEqual(networkFail.notFound, false)
assert.strictEqual(networkFail.detail, null)
assert.strictEqual(networkFail.actionType, 'loading')

const notFoundFail = buildDetailInitialFailurePatch({ code: 404 })
assert.strictEqual(notFoundFail.loadError, false)
assert.strictEqual(notFoundFail.notFound, true)

const serverFail = buildDetailInitialFailurePatch({ code: 500, message: '服务异常' })
assert.strictEqual(serverFail.loadError, true)
assert.strictEqual(serverFail.notFound, false)

const prevDetail = {
  detail: { id: 5, title: '校园讲座' },
  coverClass: 'hc2',
  actionType: 'enroll'
}

const refreshNetworkFail = buildDetailRefreshFailurePatch(new Error('network'), prevDetail)
assert.strictEqual(refreshNetworkFail.refreshError, true)
assert.strictEqual(refreshNetworkFail.loadError, false)
assert.strictEqual(refreshNetworkFail.notFound, false)
assert.strictEqual(refreshNetworkFail.detail, undefined)

const refreshNotFound = buildDetailRefreshFailurePatch({ code: 404 }, prevDetail)
assert.strictEqual(refreshNotFound.notFound, true)
assert.strictEqual(refreshNotFound.detail, null)
assert.strictEqual(refreshNotFound.refreshError, false)

const refreshWithoutContent = buildDetailRefreshFailurePatch(new Error('network'), { detail: null })
assert.strictEqual(refreshWithoutContent.loadError, true)
assert.strictEqual(refreshWithoutContent.detail, null)

assert.throws(
  () => buildDetailLoadedView(null, 5, true, decorateDetail),
  /activity detail unavailable/
)

const loadingPatch = buildDetailLoadingPatch()
assert.strictEqual(loadingPatch.loading, true)
assert.strictEqual(loadingPatch.detail, null)

assert.strictEqual(shouldRefreshDetailOnShow(false, false), false)
assert.strictEqual(shouldRefreshDetailOnShow(true, false), true)
assert.strictEqual(shouldRefreshDetailOnShow(true, true), false)

const missingIdPatch = buildDetailMissingIdPatch()
assert.strictEqual(missingIdPatch.loading, false)
assert.strictEqual(missingIdPatch.notFound, true)
assert.strictEqual(missingIdPatch.loadError, false)
assert.strictEqual(missingIdPatch.detail, null)

const noOpts = resolveDetailOnLoad(undefined)
assert.strictEqual(noOpts.shouldLoad, false)
assert.strictEqual(noOpts.activityId, null)
assert.strictEqual(noOpts.patch.notFound, true)
assert.strictEqual(noOpts.patch.loading, false)

const emptyOpts = resolveDetailOnLoad({})
assert.strictEqual(emptyOpts.shouldLoad, false)
assert.strictEqual(emptyOpts.patch.notFound, true)

const blankId = resolveDetailOnLoad({ id: '' })
assert.strictEqual(blankId.shouldLoad, false)
assert.strictEqual(blankId.patch.notFound, true)

const validId = resolveDetailOnLoad({ id: 5 })
assert.strictEqual(validId.shouldLoad, true)
assert.strictEqual(validId.activityId, 5)
assert.deepStrictEqual(validId.patch, { activityId: 5 })

const altId = resolveDetailOnLoad({ activityId: '8' })
assert.strictEqual(altId.shouldLoad, true)
assert.strictEqual(altId.activityId, '8')

console.log('[detailPageInit.test] PASS')
