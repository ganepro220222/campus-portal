/**
 * 活动数据映射单测
 * 运行：node miniapp/utils/activity.test.js
 */
const assert = require('assert')
const {
  resolveEmptyActivityDetail,
  mergeActivityDetail,
  hasActiveEnroll,
  enrollStatusLabel
} = require('./activity')

assert.strictEqual(resolveEmptyActivityDetail(false), null)
assert.ok(resolveEmptyActivityDetail(true))
assert.ok(resolveEmptyActivityDetail(true).title)

const merged = mergeActivityDetail({
  id: 3,
  title: '测试活动',
  location: '图书馆',
  startTime: '2026-08-01 09:00',
  quota: 50,
  enrolledCount: 10,
  enrollStatus: 'none'
}, {})
assert.strictEqual(merged.id, 3)
assert.strictEqual(merged.title, '测试活动')
assert.strictEqual(merged.full, false)
assert.strictEqual(merged.enrollStatus, 'none')

assert.strictEqual(hasActiveEnroll({ enrollStatus: 'pending' }), true)
assert.strictEqual(hasActiveEnroll({ enrollStatus: 'approved' }), true)
assert.strictEqual(hasActiveEnroll({ enrollStatus: 'none' }), false)
assert.strictEqual(hasActiveEnroll(null), false)

assert.strictEqual(enrollStatusLabel('approved'), '已通过')

console.log('[activity.test] PASS')
