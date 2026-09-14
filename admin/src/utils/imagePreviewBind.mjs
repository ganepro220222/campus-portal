/**
 * 后台弹窗里的图片缩略图：同一地址最多自动再绑一次。
 * 关窗清空、弹窗进场、CDN 刚回源时，第一次拉图容易失败；真 404 不会死循环。
 */

export const IMAGE_PREVIEW_RETRY_MS = 400
export const IMAGE_PREVIEW_MAX_RETRIES = 1

export function nextImagePreviewRetry(retryCount, boundSrc, failedSrc) {
  const url = boundSrc == null ? '' : String(boundSrc).trim()
  const failed = failedSrc == null ? '' : String(failedSrc).trim()
  if (!url || !failed || url !== failed) {
    return null
  }
  const count = Number(retryCount) || 0
  if (count >= IMAGE_PREVIEW_MAX_RETRIES) {
    return null
  }
  return { retryCount: count + 1, delayMs: IMAGE_PREVIEW_RETRY_MS }
}
