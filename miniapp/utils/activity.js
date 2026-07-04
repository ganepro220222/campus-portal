// utils/activity.js — 活动详情/报名数据映射

const mock = require('../mock/defaults')

function mergeActivityDetail(raw, fallback) {
  const base = fallback || mock.activityDetail || {}
  if (!raw) return base
  return {
    ...base,
    ...raw,
    title: raw.title || base.title,
    location: raw.location || base.location,
    startTime: raw.startTime || base.startTime,
    intro: raw.intro || base.intro,
    tag: raw.tag || base.tag,
    canEnroll: raw.canEnroll != null ? raw.canEnroll : base.canEnroll,
    enrollStatus: raw.enrollStatus || base.enrollStatus || 'none'
  }
}

function mergeEnrollResult(raw) {
  if (!raw) return null
  return {
    id: raw.id,
    activityId: raw.activityId,
    status: raw.status,
    voucherCode: raw.voucherCode,
    createTime: raw.createTime
  }
}

module.exports = {
  mergeActivityDetail,
  mergeEnrollResult
}
