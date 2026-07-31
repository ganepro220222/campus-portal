/** Whether a configured panorama path resolves to an existing local file (or remote URL). */
import fs from 'node:fs'
import path from 'node:path'

const REMOTE = /^(https?:|data:|blob:|\/\/|\/)/

export function isRemotePanoramaUrl(p) {
  return REMOTE.test(String(p ?? '').trim())
}

export function hasPanoramaFile(exhibitDir, panoramaPath) {
  const p = String(panoramaPath ?? '').trim()
  if (!p) return false
  if (isRemotePanoramaUrl(p)) return true
  const local = path.isAbsolute(p) ? p : path.join(exhibitDir, p)
  try {
    return fs.statSync(local).isFile()
  } catch {
    return false
  }
}
