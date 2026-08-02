/** Whether a configured asset path (panorama, model, …) resolves to an existing local file (or remote URL). */
import crypto from 'node:crypto'
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

/*
 * 资源内容指纹
 * ------------
 * 工作台按「哪些展品用了同一张背景」分组时，路径是靠不住的判据：
 *   · 只比文件名 → 各展品自带的 assets/panorama.jpg 会被误并成一组（其实是不同的图）；
 *   · 只比全路径 → 同一张图复制进 20 个展品目录，会被拆成 20 组（其实是同一张图）。
 * 唯一正确的判据是内容，所以由服务端算一个指纹给前端。
 *
 * 为什么不整文件哈希：全景图常有 5–8MB，100+ 件就是 1GB，每次刷新列表都读一遍太慢。
 * 改为「文件长度 + 头 64KiB + 尾 64KiB」，无论文件多大都是常数开销（≤128KiB）。
 * 代价：两张图若长度相同、首尾 64KiB 也完全相同、只在中段有差异，会被判为同一张。
 * 对 JPEG/PNG（头部含尺寸与量化表、尾部含结束标记）而言这需要刻意构造，实拍图不会发生。
 *
 * 三份服务端实现（Node / Python / PHP）必须给出同一个值，否则换个服务端分组就会重排；
 * pano-check.test.mjs 里有跨实现一致性测试。改算法请同步改 FINGERPRINT_VERSION。
 */
export const FINGERPRINT_VERSION = 'v1'
export const FINGERPRINT_CHUNK = 65536
export const FINGERPRINT_LENGTH = 16

function readChunk(fd, position, length) {
  const buf = Buffer.alloc(length)
  let got = 0
  while (got < length) {
    const n = fs.readSync(fd, buf, got, length - got, position + got)
    if (n <= 0) break            // 文件被截短：按实际读到的算
    got += n
  }
  return got === length ? buf : buf.subarray(0, got)
}

/** 本地资源的内容指纹；远程 URL / 缺失文件 / 读不出来一律返回 ''（前端按「无指纹」处理） */
export function assetFingerprint(exhibitDir, assetPath, exhibitsRoot = null) {
  const p = String(assetPath ?? '').trim()
  if (!p || isRemotePanoramaUrl(p)) return ''
  const local = resolvePanoramaLocalPath(exhibitDir, p, exhibitsRoot)
  if (!local) return ''
  let fd = null
  try {
    const st = fs.statSync(local)
    if (!st.isFile()) return ''
    const size = st.size
    const h = crypto.createHash('sha1')
    h.update(`${FINGERPRINT_VERSION}|${size}|`, 'utf8')
    fd = fs.openSync(local, 'r')
    const headLen = Math.min(size, FINGERPRINT_CHUNK)
    if (headLen > 0) h.update(readChunk(fd, 0, headLen))
    const tailStart = Math.max(FINGERPRINT_CHUNK, size - FINGERPRINT_CHUNK)
    if (size > tailStart) h.update(readChunk(fd, tailStart, size - tailStart))
    return h.digest('hex').slice(0, FINGERPRINT_LENGTH)
  } catch {
    return ''
  } finally {
    if (fd !== null) {
      try { fs.closeSync(fd) } catch { /* 已关闭或句柄失效，忽略 */ }
    }
  }
}
