// utils/activity.js — 活动详情/报名数据映射

const mock = require('../mock/defaults')

const ENROLL_STATUS = {
  none: '',
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  cancelled: '已取消'
}

function mergeActivityDetail(raw, fallback) {
  const base = fallback || mock.activityDetail || {}
  if (!raw) return { ...base }
  const quota = raw.quota != null ? raw.quota : base.quota
  const enrolledCount = raw.enrolledCount != null ? raw.enrolledCount : base.enrolledCount
  const full = raw.full != null
    ? raw.full
    : (quota > 0 && enrolledCount >= quota)
  return {
    ...base,
    ...raw,
    title: raw.title || base.title,
    location: raw.location || base.location,
    startTime: raw.startTime || base.startTime,
    endTime: raw.endTime || raw.endTime,
    enrollStartTime: raw.enrollStartTime || '',
    enrollEndTime: raw.enrollEndTime || '',
    intro: raw.intro || base.intro,
    tag: raw.tag || base.tag,
    quota,
    enrolledCount,
    full,
    needReview: !!raw.needReview,
    canEnroll: raw.canEnroll != null ? raw.canEnroll : base.canEnroll,
    enrollStatus: raw.enrollStatus || base.enrollStatus || 'none',
    enrollId: raw.enrollId || null,
    voucherCode: raw.voucherCode || ''
  }
}

function mergeEnrollResult(raw) {
  if (!raw) return null
  return {
    id: raw.id,
    activityId: raw.activityId,
    status: raw.status,
    statusLabel: ENROLL_STATUS[raw.status] || raw.status,
    voucherCode: raw.voucherCode,
    createTime: raw.createTime,
    activityTitle: raw.activityTitle
  }
}

function enrollStatusLabel(status) {
  return ENROLL_STATUS[status] || status || ''
}

/** 是否已有有效报名（待审/已通过） */
function hasActiveEnroll(detail) {
  const st = detail && detail.enrollStatus
  return st === 'pending' || st === 'approved'
}

/** 底部操作区类型 */
function resolveDetailAction(detail, isLoggedIn) {
  if (!detail) return { actionType: 'loading', hint: '' }
  if (!isLoggedIn) return { actionType: 'login', hint: '登录后报名' }

  const st = detail.enrollStatus || 'none'
  if (st === 'pending') return { actionType: 'pending', hint: '报名审核中' }
  if (st === 'approved') return { actionType: 'approved', hint: '报名成功' }
  if (st === 'rejected') return { actionType: 'rejected', hint: '审核未通过，可重新报名' }

  if (detail.full) return { actionType: 'disabled', hint: '名额已满' }
  if (!detail.canEnroll) return { actionType: 'disabled', hint: '当前不在报名时间' }
  return { actionType: 'enroll', hint: '' }
}

module.exports = {
  mergeActivityDetail,
  mergeEnrollResult,
  enrollStatusLabel,
  hasActiveEnroll,
  resolveDetailAction,
  ENROLL_STATUS
}
