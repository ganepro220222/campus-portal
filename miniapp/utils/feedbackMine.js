// utils/feedbackMine.js — 我的反馈：状态文案、详情路由、失败不伪装成空列表

function feedbackStatusLabel(status) {
  if (status === 'replied') return '已回复'
  if (status === 'pending') return '待回复'
  return status || ''
}

function feedbackDetailPath(id) {
  const n = Number(id)
  if (!Number.isFinite(n) || n <= 0) return ''
  return `/packageC/feedback/detail?id=${n}`
}

function isFeedbackNotFound(err) {
  return !!(err && Number(err.code) === 404)
}

function buildFeedbackListFailurePatch(hasList) {
  if (hasList) {
    return { loading: false, loadError: false, refreshError: true }
  }
  return { loading: false, loadError: true, refreshError: false }
}

function buildFeedbackListLoadedPatch(list) {
  const records = Array.isArray(list) ? list : []
  return {
    list: records,
    loading: false,
    loadError: false,
    refreshError: false
  }
}

module.exports = {
  feedbackStatusLabel,
  feedbackDetailPath,
  isFeedbackNotFound,
  buildFeedbackListFailurePatch,
  buildFeedbackListLoadedPatch
}
