/**
 * 活动报名页初始化状态单测
 * 运行：node miniapp/utils/enrollPageInit.test.js
 */
const assert = require('assert')
const { assertActivityDetailRaw } = require('./activityDetailLoad')
const {
  buildEnrollLoadingPatch,
  buildEnrollLoadedView,
  buildEnrollFailurePatch,
  buildEnrollFormFromProfile,
  buildApprovedEnrolledHint,
  resolveEnrollPagePhase,
  canSubmitEnroll
} = require('./enrollPageInit')

assert.throws(() => assertActivityDetailRaw(null, 1), /activity detail unavailable/)
assert.throws(() => assertActivityDetailRaw({}, 1), /activity detail unavailable/)
assert.throws(() => assertActivityDetailRaw({ id: 2 }, 1), /activity id mismatch/)
assert.doesNotThrow(() => assertActivityDetailRaw({ id: 1 }, 1))
assert.doesNotThrow(() => assertActivityDetailRaw({ id: '1' }, 1))

const loading = buildEnrollLoadingPatch()
assert.strictEqual(loading.loading, true)
assert.strictEqual(loading.loadError, false)
assert.strictEqual(loading.notFound, false)
assert.strictEqual(loading.detail, null)

const activityRaw = {
  id: 7,
  title: '讲座',
  location: 'A101',
  startTime: '2026-08-01 14:00',
  enrollStatus: 'none',
  canEnroll: true
}
const profile = { realName: '张三', phone: '13800138000', college: '交院', grade: '2024 级' }

const loaded = buildEnrollLoadedView(activityRaw, profile, 7)
assert.strictEqual(loaded.loading, false)
assert.strictEqual(loaded.loadError, false)
assert.strictEqual(loaded.notFound, false)
assert.strictEqual(loaded.detail.title, '讲座')
assert.strictEqual(loaded.hasEnrolled, false)
assert.strictEqual(loaded.form.name, '张三')
assert.strictEqual(loaded.form.phone, '13800138000')

const loadedNoProfile = buildEnrollLoadedView(activityRaw, null, 7)
assert.strictEqual(loadedNoProfile.form.name, '')
assert.strictEqual(loadedNoProfile.form.phone, '')

const networkFail = buildEnrollFailurePatch(new Error('network'))
assert.strictEqual(networkFail.loading, false)
assert.strictEqual(networkFail.loadError, true)
assert.strictEqual(networkFail.notFound, false)
assert.strictEqual(networkFail.detail, null)

const notFoundFail = buildEnrollFailurePatch({ code: 404, message: '活动不存在' })
assert.strictEqual(notFoundFail.loadError, false)
assert.strictEqual(notFoundFail.notFound, true)

assert.throws(
  () => buildEnrollLoadedView(null, profile, 7),
  /activity detail unavailable/
)

assert.strictEqual(resolveEnrollPagePhase({ loading: true }), 'loading')
assert.strictEqual(resolveEnrollPagePhase({ loading: false, loadError: true }), 'loadError')
assert.strictEqual(resolveEnrollPagePhase({ loading: false, notFound: true }), 'notFound')
assert.strictEqual(
  resolveEnrollPagePhase({ loading: false, detail: { id: 1, title: 'x' } }),
  'content'
)
assert.strictEqual(resolveEnrollPagePhase({ loading: false, detail: null }), 'notFound')
assert.strictEqual(resolveEnrollPagePhase({ loading: false, detail: {} }), 'notFound')

const submitOk = {
  activityId: 7,
  detail: { id: 7, title: '讲座' },
  loading: false,
  loadError: false,
  notFound: false,
  submitting: false
}
assert.strictEqual(canSubmitEnroll(submitOk), true)

assert.strictEqual(canSubmitEnroll({ ...submitOk, loadError: true }), false)
assert.strictEqual(canSubmitEnroll({ ...submitOk, notFound: true }), false)
assert.strictEqual(canSubmitEnroll({ ...submitOk, loading: true }), false)
assert.strictEqual(canSubmitEnroll({ ...submitOk, detail: null }), false)
assert.strictEqual(canSubmitEnroll({ ...submitOk, detail: { id: 8 } }), false)
assert.strictEqual(canSubmitEnroll({ ...submitOk, submitting: true }), false)

const form = buildEnrollFormFromProfile({ realName: '李四', phone: '13900139000' })
assert.strictEqual(form.name, '李四')
assert.strictEqual(form.phone, '13900139000')

assert.ok(buildApprovedEnrolledHint().includes('二维码'))

console.log('[enrollPageInit.test] PASS')
