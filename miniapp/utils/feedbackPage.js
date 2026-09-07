// utils/feedbackPage.js — 意见反馈页：登录与上传错误文案（可单测）

function canAccessFeedback(isLoggedIn) {
  return !!isLoggedIn
}

function isFeedbackSubmitLocked({ submitting, submitted }) {
  return !!(submitting || submitted)
}

function shouldNavigateBackAfterSubmit(pages, route) {
  if (!Array.isArray(pages) || pages.length < 2) return false
  const top = pages[pages.length - 1]
  return !!(top && top.route === route)
}

function resolveUploadErrorMessage(err) {
  if (!err) return '图片上传失败，可点图片重试'
  const code = err.code != null ? Number(err.code) : NaN
  if (code === 401) return '请先登录后再上传图片'
  if (code === 413) return '图片过大，请重新选择或压缩'
  if (err.message === 'invalid upload url') return '上传响应异常，请重试或删除该图'
  if (err.message) return err.message
  return '图片上传失败，可点图片重试'
}

function canStartChooseImages({ choosing, loggedIn, remaining }) {
  if (choosing) return { ok: false, reason: 'busy' }
  if (!loggedIn) return { ok: false, reason: 'login' }
  if (remaining <= 0) return { ok: false, reason: 'full' }
  return { ok: true }
}

module.exports = {
  canAccessFeedback,
  isFeedbackSubmitLocked,
  shouldNavigateBackAfterSubmit,
  resolveUploadErrorMessage,
  canStartChooseImages
}
