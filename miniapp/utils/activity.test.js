/**
 * 活动数据映射单测
 * 运行：node miniapp/utils/activity.test.js
 */
const assert = require('assert')
const fs = require('fs')
const path = require('path')
const {
  formatEnrollWindowText,
  resolveEmptyActivityDetail,
  mergeActivityDetail,
  hasActiveEnroll,
  enrollStatusLabel,
  resolveDetailAction,
  canStartCancelEnroll,
  cancelEnrollButtonText
} = require('./activity')
const { decorateActivities } = require('./decorate')

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

function action(detail, loggedIn) {
  return resolveDetailAction(detail, loggedIn !== false)
}

function guest(detail) {
  return resolveDetailAction(detail, false)
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
assert.match(detailWxml, /detail.enrollWindowText/)
assert.doesNotMatch(detailWxml, /wx:if="\{\{detail.enrollStartTime\}\}"/)

assert.strictEqual(
  formatEnrollWindowText('', '2026-09-10 14:00'),
  '报名时间：发布后即可报名，截止至 2026-09-10 14:00'
)
assert.strictEqual(
  formatEnrollWindowText('2026-09-01 09:00', '2026-09-10 14:00'),
  '报名时间：2026-09-01 09:00 至 2026-09-10 14:00'
)
const emptyStart = mergeActivityDetail({
  id: 5,
  title: '默认窗口',
  enrollStartTime: '',
  enrollEndTime: '2026-09-10 14:00'
}, {})
assert.strictEqual(emptyStart.enrollWindowText, '报名时间：发布后即可报名，截止至 2026-09-10 14:00')

const listCards = decorateActivities([
  { id: 1, canEnroll: true, enrollState: 'open', enrollHint: '立即报名', quota: 10, enrolledCount: 1 },
  { id: 2, canEnroll: false, enrollState: 'not_started', enrollHint: '报名未开始', quota: 10, enrolledCount: 1 },
  { id: 3, canEnroll: false, enrollState: 'closed', enrollHint: '报名已截止', quota: 10, enrolledCount: 1 },
  { id: 4, canEnroll: false, enrollState: 'started', enrollHint: '进行中', quota: 10, enrolledCount: 1 },
  { id: 5, canEnroll: false, enrollState: 'started_no_end', enrollHint: '已开始', quota: 10, enrolledCount: 1 },
  { id: 6, canEnroll: false, enrollState: 'ended', enrollHint: '已结束', quota: 10, enrolledCount: 1 },
  { id: 7, canEnroll: false, enrollState: 'full', enrollHint: '已满', full: true, quota: 10, enrolledCount: 10 }
])
assert.strictEqual(listCards[0].enrollHint, '立即报名')
assert.strictEqual(listCards[1].enrollHint, '报名未开始')
assert.strictEqual(listCards[2].enrollHint, '报名已截止')
assert.strictEqual(listCards[3].enrollHint, '进行中')
assert.strictEqual(listCards[4].enrollHint, '已开始')
assert.strictEqual(listCards[5].enrollHint, '已结束')
assert.strictEqual(listCards[6].enrollHint, '已满')

assert.strictEqual(guest({ enrollStatus: 'none', canEnroll: true, full: false }).actionType, 'login')
assert.strictEqual(guest({ enrollStatus: 'none', canEnroll: true, full: false }).hint, '登录后报名')
assert.strictEqual(guest({ enrollStatus: 'none', canEnroll: false, full: true, enrollState: 'full', enrollHint: '已满' }).hint, '名额已满')
assert.strictEqual(guest({ enrollStatus: 'none', canEnroll: false, enrollState: 'closed', enrollHint: '报名已截止' }).hint, '报名已截止')
assert.strictEqual(guest({ enrollStatus: 'none', canEnroll: false, enrollState: 'not_started', enrollHint: '报名未开始' }).hint, '报名未开始')
assert.strictEqual(guest({ enrollStatus: 'none', canEnroll: false, enrollState: 'started', enrollHint: '进行中' }).hint, '进行中')
assert.strictEqual(guest({ enrollStatus: 'none', canEnroll: false, enrollState: 'started_no_end', enrollHint: '已开始' }).hint, '已开始')
assert.strictEqual(guest({ enrollStatus: 'none', canEnroll: false, enrollState: 'ended', enrollHint: '已结束', full: true }).hint, '已结束')
assert.strictEqual(guest({ enrollStatus: 'none', canEnroll: false, enrollState: 'ended', enrollHint: '已结束', full: true }).actionType, 'disabled')

const listWxml = fs.readFileSync(path.join(__dirname, '../pages/activity/index.wxml'), 'utf8')
assert.match(listWxml, /item.enrollHint/)
assert.match(listWxml, /item.canEnroll/)
assert.doesNotMatch(listWxml, /item.full \? '已满' : '报名'/)

console.log('[activity.test] PASS')
