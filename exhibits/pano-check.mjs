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

/** 批量面板校验全景路径：true / false / 'unknown'（远程或展品内相对路径） */
export function checkPanoramaPathAvailability(panoramaPath, exhibitsRoot) {
  const p = String(panoramaPath ?? '').trim()
  if (!p) return false
  if (isRemotePanoramaUrl(p)) return 'unknown'
  if (p.startsWith('../') || p.startsWith('/')) {
    const refDir = path.join(exhibitsRoot, '_template')
    return hasAssetFile(refDir, p, exhibitsRoot) ? true : false
  }
  return 'unknown'
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

/*
 * 全景图候选清单
 * --------------
 * 批量编辑「全景贴图」下拉：只列可信来源，不全树扫描。
 *   1. 各展品 config 里实际声明的 assets.panorama（本地文件）；
 *   2. 约定公共目录（共享背景/、_panoramas/、shared/panoramas/）下的 2:1 图片。
 * 宽高比 1.9～2.1 仅作格式校验，不作「发现全景」的依据——2:1 贴图/横幅不能进候选。
 */
const PANO_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const PANO_SKIP_DIRS = new Set(['node_modules', 'vendor', '_runtime', '_dev', 'e2e', 'test-results', 'playwright-report'])
/** 公共全景目录（相对 exhibits/ 根）；仅在这些目录内扫描未配置的 2:1 图 */
export const PANO_PUBLIC_DIRS = ['共享背景', '_panoramas', 'shared/panoramas']
// 等距柱状投影固有 2:1。放到 1.7 会把 16:9 的截图（1.778）也当成全景图 —— 宁可漏，不可错。
export const PANO_RATIO_MIN = 1.9
export const PANO_RATIO_MAX = 2.1
const PANO_MAX_SCAN = 400

/** 从图头读宽高；只支持 JPEG / PNG / WebP(VP8X|VP8|VP8L)，读不出返回 null */
export function imageSize(buf) {
  if (!buf || buf.length < 16) return null
  // PNG: 8 字节签名 + IHDR
  if (buf.readUInt32BE(0) === 0x89504e47 && buf.readUInt32BE(4) === 0x0d0a1a0a) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  }
  // WebP: RIFF....WEBP
  if (buf.length >= 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const fmt = buf.toString('ascii', 12, 16)
    if (fmt === 'VP8X') return { width: (buf.readUIntLE(24, 3) & 0xffffff) + 1, height: (buf.readUIntLE(27, 3) & 0xffffff) + 1 }
    if (fmt === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff }
    if (fmt === 'VP8L' && buf[20] === 0x2f) {
      const b = buf.readUInt32LE(21)
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 }
    }
    return null
  }
  // JPEG: 逐段找 SOFn
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue }
      const marker = buf[i + 1]
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue }
      const len = buf.readUInt16BE(i + 2)
      // SOF0..SOF15，跳过 DHT(c4)/JPGA(c8)/DAC(cc)
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
      }
      if (len < 2) return null
      i += 2 + len
    }
  }
  return null
}

export function isPanoramaRatio(size) {
  if (!size || !size.width || !size.height) return false
  const r = size.width / size.height
  return r >= PANO_RATIO_MIN && r <= PANO_RATIO_MAX
}

/** config 里的 panorama 路径 → exhibits/ 根相对路径（正斜杠）；远程 URL 返回 null */
export function panoramaToRootRel(exhibitDir, panoramaPath, exhibitsRoot) {
  const p = String(panoramaPath ?? '').trim()
  if (!p || isRemotePanoramaUrl(p)) return null
  let abs
  if (p.startsWith('/')) {
    if (!exhibitsRoot) return null
    abs = path.join(exhibitsRoot, p.replace(/^\/+/, ''))
  } else if (path.isAbsolute(p)) {
    abs = p
  } else {
    abs = path.join(exhibitDir, p)
  }
  if (!exhibitsRoot) return null
  const rel = path.relative(exhibitsRoot, abs)
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null
  return rel.split(path.sep).join('/')
}

function readLocalImageMeta(exhibitsRoot, rootRel) {
  const full = path.join(exhibitsRoot, ...rootRel.split('/'))
  if (!PANO_EXT.has(path.extname(full).toLowerCase())) return null
  let fd = null
  const head = Buffer.alloc(65536)
  try {
    if (!fs.statSync(full).isFile()) return null
    fd = fs.openSync(full, 'r')
    const n = fs.readSync(fd, head, 0, head.length, 0)
    const size = imageSize(head.subarray(0, n))
    if (!isPanoramaRatio(size)) return null
    return { width: size.width, height: size.height }
  } catch {
    return null
  } finally {
    if (fd !== null) { try { fs.closeSync(fd) } catch {} }
  }
}

function addCandidate(map, entry) {
  if (map.size >= PANO_MAX_SCAN) return
  const prev = map.get(entry.path)
  if (!prev || (prev.source === 'shared' && entry.source === 'configured')) map.set(entry.path, entry)
}

function listExhibitDirs(exhibitsRoot) {
  const out = []
  let items
  try { items = fs.readdirSync(exhibitsRoot, { withFileTypes: true }) } catch { return out }
  for (const it of items) {
    if (!it.isDirectory() || it.name.startsWith('_') || it.name.startsWith('.')) continue
    try {
      if (fs.statSync(path.join(exhibitsRoot, it.name, 'config.json')).isFile()) out.push(it.name)
    } catch { /* 非展品目录 */ }
  }
  return out.sort()
}

/** 扫描可信来源，返回 [{ path, width, height, source }]（path 相对 exhibits/，正斜杠） */
export function listPanoramaCandidates(exhibitsRoot) {
  const root = path.resolve(exhibitsRoot)
  const map = new Map()

  for (const ex of listExhibitDirs(root)) {
    if (map.size >= PANO_MAX_SCAN) break
    const exhibitDir = path.join(root, ex)
    let cfg
    try { cfg = JSON.parse(fs.readFileSync(path.join(exhibitDir, 'config.json'), 'utf8')) } catch { continue }
    const pano = cfg?.assets?.panorama
    if (!pano || isRemotePanoramaUrl(pano)) continue
    const rootRel = panoramaToRootRel(exhibitDir, pano, root)
    if (!rootRel) continue
    const meta = readLocalImageMeta(root, rootRel)
    if (meta) addCandidate(map, { path: rootRel, ...meta, source: 'configured' })
  }

  const walkShared = (dir, rel) => {
    if (map.size >= PANO_MAX_SCAN) return
    let items
    try { items = fs.readdirSync(dir, { withFileTypes: true }) } catch { return }
    for (const it of items) {
      if (map.size >= PANO_MAX_SCAN) return
      if (it.name.startsWith('.')) continue
      const full = path.join(dir, it.name)
      const r = rel ? `${rel}/${it.name}` : it.name
      if (it.isDirectory()) {
        if (!PANO_SKIP_DIRS.has(it.name)) walkShared(full, r)
        continue
      }
      if (!it.isFile()) continue
      const meta = readLocalImageMeta(root, r)
      if (meta) addCandidate(map, { path: r, ...meta, source: 'shared' })
    }
  }

  for (const pub of PANO_PUBLIC_DIRS) {
    if (map.size >= PANO_MAX_SCAN) break
    const dir = path.join(root, ...pub.split('/'))
    try {
      if (fs.statSync(dir).isDirectory()) walkShared(dir, pub.replace(/\\/g, '/'))
    } catch { /* 目录不存在 */ }
  }

  const order = { configured: 0, shared: 1 }
  return [...map.values()].sort((a, b) =>
    (order[a.source] - order[b.source]) || a.path.localeCompare(b.path))
}
