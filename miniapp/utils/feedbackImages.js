// utils/feedbackImages.js — 意见反馈附图选择与 URL 校验

const MAX_IMAGES = 9

function isHttpUrl(value) {
  const s = value != null ? String(value).trim() : ''
  return /^https?:\/\/.+/i.test(s)
}

function normalizeUploadedUrl(data) {
  if (!data) return ''
  const url = data.url != null ? String(data.url).trim() : ''
  return isHttpUrl(url) ? url : ''
}

function buildSubmitImages(items) {
  return (items || [])
    .map(it => (it && it.url != null ? String(it.url).trim() : ''))
    .filter(isHttpUrl)
    .slice(0, MAX_IMAGES)
}

function remainingSlots(currentCount) {
  const n = Number(currentCount) || 0
  return Math.max(0, MAX_IMAGES - n)
}

module.exports = {
  MAX_IMAGES,
  isHttpUrl,
  normalizeUploadedUrl,
  buildSubmitImages,
  remainingSlots
}
