/**
 * 工作台静态托管路径守卫（EX-01 / EX-09 / EX-10）。
 * Node 与 serve.py 的 deny 规则必须一致；改算法请同步改 Python。
 */
import path from 'node:path'

/** 文档约定的公共全景目录，允许下划线开头。其余 _ 前缀视为基础设施。 */
export const STATIC_UNDERSCORE_ALLOW = new Set(['_panoramas'])

export function decodeStaticRel(urlPath) {
  const raw = String(urlPath || '/').split('?')[0]
  let decoded
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    const err = new Error('malformed URI')
    err.code = 'BAD_URI'
    throw err
  }
  let rel = decoded.replace(/^\/+/, '')
  if (rel === '') rel = 'studio.html'
  if (rel.endsWith('/')) rel += 'index.html'
  return rel
}

export function denyStaticRelReason(rel) {
  const parts = String(rel || '').split(/[/\\]+/).filter(Boolean)
  if (parts.some((p) => p === '..')) return 'traversal'
  if (parts.some((p) => p.startsWith('.'))) return 'hidden'
  if (parts.some((p) => p.startsWith('_') && !STATIC_UNDERSCORE_ALLOW.has(p))) return 'private'
  return ''
}

export function isResolvedInsideRoot(root, full) {
  const r = path.resolve(root)
  const f = path.resolve(full)
  return f === r || f.startsWith(r + path.sep)
}
