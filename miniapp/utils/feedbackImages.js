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

function failedImageCount(images) {
  return (images || []).filter(it => it && it.failed && !it.uploading).length
}

function gateFeedbackSubmit(images) {
  const list = Array.isArray(images) ? images : []
  if (list.some(it => it && it.uploading)) return { kind: 'wait' }
  const failedCount = failedImageCount(list)
  if (failedCount) return { kind: 'failed', failedCount }
  return { kind: 'ok', imageUrls: buildSubmitImages(list) }
}

function buildSubmitImagesOmittingFailed(images) {
  return buildSubmitImages((images || []).filter(it => it && !it.failed))
}

function resolveFeedbackSubmitToast(omittedCount) {
  const n = Number(omittedCount) || 0
  if (n > 0) {
    return { title: `反馈已提交，${n} 张失败图片未包含`, icon: 'none', duration: 2500 }
  }
  return { title: '感谢反馈，已提交', icon: 'success' }
}

function canRetryFeedbackImage(item, inFlight) {
  if (!item || item.uploading || inFlight) return false
  const localPath = item.localPath != null ? String(item.localPath) : ''
  return !!item.failed && !!localPath
}

function retryFeedbackImagePatch() {
  return { uploading: true, failed: false, url: '' }
}

module.exports = {
  MAX_IMAGES,
  isHttpUrl,
  normalizeUploadedUrl,
  buildSubmitImages,
  remainingSlots,
  failedImageCount,
  gateFeedbackSubmit,
  buildSubmitImagesOmittingFailed,
  resolveFeedbackSubmitToast,
  canRetryFeedbackImage,
  retryFeedbackImagePatch
}
