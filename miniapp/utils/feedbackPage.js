// utils/feedbackPage.js — 意见反馈页：登录与上传错误文案（可单测）

function canAccessFeedback(isLoggedIn) {
  return !!isLoggedIn
}

function resolveUploadErrorMessage(err) {
  if (!err) return '图片上传失败，可点图片重试'
  const code = err.code != null ? Number(err.code) : NaN
  if (code === 401) return '请先登录后再上传图片'
  if (code === 413) return '图片过大，请重新选择或压缩'
  if (err.message) return err.message
  return '图片上传失败，可点图片重试'
}

module.exports = {
  canAccessFeedback,
  resolveUploadErrorMessage
}
