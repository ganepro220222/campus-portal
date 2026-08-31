/** 直传 OSS 成功、/complete 尚未确认时的本地恢复。 */

export const DIRECT_PENDING_KEY = 'shuyuan.oss-direct-pending.v1'
export const DIRECT_PENDING_MAX_AGE_MS = 48 * 60 * 60 * 1000

export function parseDirectPending(raw, now = Date.now()) {
  if (raw == null || String(raw).trim() === '') {
    return null
  }
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (!parsed || typeof parsed !== 'object') {
      return null
    }
    const scene = String(parsed.scene || '')
    const objectKey = String(parsed.objectKey || '')
    const size = Number(parsed.size)
    const fileName = String(parsed.fileName || '')
    const uploadedAt = Number(parsed.uploadedAt)
    if (!scene || !objectKey || !Number.isFinite(size) || size <= 0) {
      return null
    }
    if (!Number.isFinite(uploadedAt) || now - uploadedAt > DIRECT_PENDING_MAX_AGE_MS) {
      return null
    }
    return { scene, objectKey, size, fileName, uploadedAt }
  } catch {
    return null
  }
}

export function pendingForScene(pending, scene) {
  if (!pending || pending.scene !== scene) {
    return null
  }
  return pending
}
