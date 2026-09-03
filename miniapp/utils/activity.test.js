/**
 * 活动数据映射单测
 * 运行：node miniapp/utils/activity.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {
  resolveEmptyActivityDetail,
  mergeActivityDetail,
  hasActiveEnroll,
  enrollStatusLabel,
  resolveDetailAction,
  canStartCancelEnroll,
  cancelEnrollButtonText
} = require('./activity')

assert.strictEqual(resolveEmptyActivityDetail(false), null)
assert.ok(resolveEmptyActivityDetail(true))
assert.ok(resolveEmptyActivityDetail(true).title)

const merged = mergeActivityDetail({
  id: 3,
  title: '测试活动',
  location: '图书馆',
  startTime: '2026-08-01 09:00',
  endTime: '2026-08-01 12:00',
  quota: 50,
  enrolledCount: 10,
  enrollStatus: 'none'
}, {})
assert.strictEqual(merged.id, 3)
assert.strictEqual(merged.title, '测试活动')
assert.strictEqual(merged.full, false)
assert.strictEqual(merged.enrollStatus, 'none')

const fallbackEnd = mergeActivityDetail({ id: 4, title: '无结束时间' }, { endTime: '2026-08-02 18:00' })
assert.strictEqual(fallbackEnd.endTime, '2026-08-02 18:00')

assert.strictEqual(hasActiveEnroll({ enrollStatus: 'pending' }), true)
assert.strictEqual(hasActiveEnroll({ enrollStatus: 'approved' }), true)
assert.strictEqual(hasActiveEnroll({ enrollStatus: 'none' }), false)
assert.strictEqual(hasActiveEnroll(null), false)

assert.strictEqual(enrollStatusLabel('approved'), '已通过')
assert.strictEqual(enrollStatusLabel('none'), '')

function action(detail) {
  return resolveDetailAction(detail, true)
}

assert.strictEqual(action({ enrollStatus: 'rejected', full: false, canEnroll: true }).actionType, 'rejected')
assert.strictEqual(action({ enrollStatus: 'rejected', full: true, canEnroll: false }).actionType, 'disabled')
assert.strictEqual(action({ enrollStatus: 'rejected', full: true, canEnroll: false }).hint, '名额已满')
assert.strictEqual(action({ enrollStatus: 'rejected', full: false, canEnroll: false }).actionType, 'disabled')
assert.strictEqual(action({ enrollStatus: 'rejected', full: false, canEnroll: false }).hint, '当前不在报名时间')

assert.strictEqual(action({ enrollStatus: 'pending', canCancel: false, cancelHint: '活动已经开始，无法取消报名' }).actionType, 'disabled')
assert.strictEqual(action({ enrollStatus: 'pending', canCancel: true }).actionType, 'pending')
assert.strictEqual(action({ enrollStatus: 'approved', canCancel: true }).actionType, 'approved')

assert.strictEqual(canStartCancelEnroll(false), true)
assert.strictEqual(canStartCancelEnroll(true), false)
assert.strictEqual(cancelEnrollButtonText(false), '取消报名')
assert.strictEqual(cancelEnrollButtonText(true), '取消中…')

const detailJs = fs.readFileSync(path.join(__dirname, '../packageC/activity/detail.js'), 'utf8')
assert.match(detailJs, /canStartCancelEnroll\(this\._cancelling/)
assert.match(detailJs, /this\._cancelling = true/)
const detailWxml = fs.readFileSync(path.join(__dirname, '../packageC/activity/detail.wxml'), 'utf8')
assert.match(detailWxml, /取消中…/)
assert.match(detailWxml, /disabled="\{\{cancelling\}\}"/)

console.log('[activity.test] PASS')
