/**
 * Per-exhibits-root identity from normalized absolute path (survives folder copy).
 * Launchers compare rootHash to detect default studio port occupied by another directory.
 */
import crypto from 'node:crypto'
import path from 'node:path'

export function normalizeRootPath(root) {
  const resolved = path.resolve(root)
  const normalized = resolved.replace(/\\/g, '/')
  return process.platform === 'win32' ? normalized.toLowerCase() : normalized
}

export function computeRootHash(root) {
  return crypto.createHash('sha256').update(normalizeRootPath(root)).digest('hex').slice(0, 32)
}

/** JSON body for GET /studio-api/identity */
export function getIdentityPayload(root) {
  const rootHash = computeRootHash(root)
  return { rootHash, instanceId: rootHash }
}

export function isLoopbackRemoteAddress(addr) {
  const a = String(addr || '')
  return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1'
}

/**
 * identity 仅回环免鉴权。Nginx 反代到 127.0.0.1 时对端恒为回环，
 * 该接口会对公网匿名公开（只回 rootHash）。非回环直连必须走 Basic Auth。
 */
export function identityAllowsAnonymous(remoteAddress) {
  return isLoopbackRemoteAddress(remoteAddress)
}
