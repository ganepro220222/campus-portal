/**
 * 活动详情加载状态单测
 * 运行：node miniapp/utils/activityDetailLoad.test.js
 */
const assert = require('assert')
const {
  classifyActivityLoadError,
  assertActivityDetailRaw,
  buildActivityDetailLoadingPatch,
  buildActivityDetailFailurePatch,
  resolveActivityDetailPagePhase,
  shouldSilentRefreshDetail,
  shouldShowDetailRefreshBar,
  shouldShowDetailFootBar
} = require('./activityDetailLoad')

assert.strictEqual(classifyActivityLoadError({ code: 404 }), 'notFound')
assert.strictEqual(classifyActivityLoadError({ statusCode: 404 }), 'notFound')
assert.strictEqual(classifyActivityLoadError({ kind: 'notFound' }), 'notFound')
assert.strictEqual(classifyActivityLoadError({ code: 500 }), 'loadError')
assert.strictEqual(classifyActivityLoadError(new Error('network')), 'loadError')

assert.throws(() => assertActivityDetailRaw(null, 1), /activity detail unavailable/)
assert.throws(() => assertActivityDetailRaw({ id: 2 }, 1), /activity id mismatch/)

const loading = buildActivityDetailLoadingPatch()
assert.strictEqual(loading.loading, true)
assert.strictEqual(loading.loadError, false)
assert.strictEqual(loading.notFound, false)
assert.strictEqual(loading.refreshError, false)

const networkFail = buildActivityDetailFailurePatch(new Error('network'))
assert.strictEqual(networkFail.loadError, true)
assert.strictEqual(networkFail.notFound, false)
assert.strictEqual(networkFail.detail, null)

const notFoundFail = buildActivityDetailFailurePatch({ code: 404 })
assert.strictEqual(notFoundFail.loadError, false)
assert.strictEqual(notFoundFail.notFound, true)

assert.strictEqual(resolveActivityDetailPagePhase({ loading: true }), 'loading')
assert.strictEqual(resolveActivityDetailPagePhase({ loadError: true }), 'loadError')
assert.strictEqual(resolveActivityDetailPagePhase({ notFound: true }), 'notFound')
assert.strictEqual(
  resolveActivityDetailPagePhase({ detail: { id: 1, title: 'x' } }),
  'content'
)

assert.strictEqual(shouldSilentRefreshDetail({ detail: { id: 1 } }), true)
assert.strictEqual(shouldSilentRefreshDetail({ detail: null }), false)

assert.strictEqual(shouldShowDetailRefreshBar(true, false, true), true)
assert.strictEqual(shouldShowDetailRefreshBar(true, true, true), false)
assert.strictEqual(shouldShowDetailRefreshBar(false, false, true), false)

assert.strictEqual(
  shouldShowDetailFootBar({ detail: { id: 1 }, loading: false, loadError: false, notFound: false }),
  true
)
assert.strictEqual(
  shouldShowDetailFootBar({ detail: { id: 1 }, loadError: true }),
  false
)
assert.strictEqual(
  shouldShowDetailFootBar({ detail: { id: 1 }, notFound: true }),
  false
)

console.log('[activityDetailLoad.test] PASS')
