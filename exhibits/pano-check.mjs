/** Whether a configured asset path (panorama, model, …) resolves to an existing local file (or remote URL). */
import fs from 'node:fs'
import path from 'node:path'

const REMOTE = /^(https?:|data:|blob:|\/\/)/

export function isRemotePanoramaUrl(p) {
  return REMOTE.test(String(p ?? '').trim())
}

export function resolvePanoramaLocalPath(exhibitDir, panoramaPath, exhibitsRoot = null) {
  const p = String(panoramaPath ?? '').trim()
  if (!p || isRemotePanoramaUrl(p)) return null
  if (p.startsWith('/')) {
    if (!exhibitsRoot) return null
    return path.join(exhibitsRoot, p.replace(/^\/+/, ''))
  }
  if (path.isAbsolute(p)) return p
  return path.join(exhibitDir, p)
}

/** 通用资源存在性判断（模型 / 全景 / 封面共用同一套路径解析规则） */
export function hasAssetFile(exhibitDir, assetPath, exhibitsRoot = null) {
  const p = String(assetPath ?? '').trim()
  if (!p) return false
  if (isRemotePanoramaUrl(p)) return true
  const local = resolvePanoramaLocalPath(exhibitDir, p, exhibitsRoot)
  if (!local) return false
  try {
    return fs.statSync(local).isFile()
  } catch {
    return false
  }
}
