/**
 * 与后台 OssManagedObjectKey.sameStoredMedia 对齐：受管素材按 object key 比较。
 */

const MANAGED_PREFIXES = ['videos/', 'images/', 'subtitles/', 'files/', 'audios/']

function sanitize(objectKey) {
  if (objectKey == null || String(objectKey).trim() === '') return null
  const key = String(objectKey).trim()
  if (key.length > 512) return null
  if (key.includes('..') || key.includes('\\') || key.includes('\0')) return null
  const lower = key.toLowerCase()
  if (
    lower.startsWith('craft-')
    || lower.startsWith('exhibits/')
    || lower.includes('/craft-')
    || lower.startsWith('shared/')
    || lower.includes('共享')
  ) {
    return null
  }
  return key
}

export function extractManagedObjectKey(stored) {
  if (stored == null || String(stored).trim() === '') return null
  const trimmed = String(stored).trim()
  let key
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const path = new URL(trimmed).pathname
      if (!path || path === '/') return null
      key = path.startsWith('/') ? path.slice(1) : path
    } catch {
      return null
    }
  } else {
    key = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed
  }
  const q = key.indexOf('?')
  if (q >= 0) key = key.slice(0, q)
  const clean = sanitize(key)
  if (!clean) return null
  return MANAGED_PREFIXES.some((prefix) => clean.startsWith(prefix)) ? clean : null
}

export function sameStoredMedia(left, right) {
  const a = left == null ? '' : String(left).trim()
  const b = right == null ? '' : String(right).trim()
  if (a === b) return true
  const aKey = extractManagedObjectKey(a)
  const bKey = extractManagedObjectKey(b)
  return Boolean(aKey && bKey && aKey === bKey)
}
