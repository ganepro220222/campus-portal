// Rewrite relative exhibit asset paths to CDN absolute URLs.

const ABSOLUTE_RE = /^(https?:|data:|blob:)/i
export const DEFAULT_CDN_BASE = 'https://cdn.yunmanvr.com/exhibits'

export function resolveRelativeToExhibit(exhibitDir, relPath) {
  const dir = String(exhibitDir || '').replace(/^\/+|\/+$/g, '')
  const rel = String(relPath || '')
  if (!rel) return ''
  const base = dir ? `${dir}/` : ''
  const url = new URL(rel, `https://asset.local/${base}`)
  return decodeURIComponent(url.pathname.replace(/^\//, ''))
}

/** List/thumb URL: keep http(s) as-is, else prefix exhibit dir. */
export function exhibitPublicHref(dir, assetPath) {
  const p = String(assetPath || '').trim()
  if (!p) return ''
  if (ABSOLUTE_RE.test(p) || p.startsWith('//')) return p
  const name = String(dir || '').replace(/\/+$/, '')
  return name ? `${name}/${p.replace(/^\/+/, '')}` : p
}

export function toCdnUrl(cdnBase, objectKey) {
  const base = String(cdnBase || '').replace(/\/+$/, '')
  const key = String(objectKey || '').replace(/^\/+/, '')
  if (!base || !key) return ''
  return `${base}/${key}`
}

export function rewriteAssetValue(value, exhibitDir, cdnBase) {
  if (typeof value !== 'string' || !value) return value
  if (ABSOLUTE_RE.test(value)) return value
  const key = resolveRelativeToExhibit(exhibitDir, value)
  return toCdnUrl(cdnBase, key) || value
}

/**
 * CDN 绝对地址还原成展品内相对路径。不是本展品、也无法落到 exhibits 根下的，原样返回。
 * 在线编辑器把 CDN 地址还原成展品内相对路径，改为同源加载。
 */
export function localizeCdnAsset(value, exhibitDir, cdnBase = DEFAULT_CDN_BASE) {
  if (typeof value !== 'string' || !value) return value
  const base = String(cdnBase || '').replace(/\/+$/, '')
  if (!base || !value.startsWith(`${base}/`)) return value
  let key
  try {
    key = decodeURIComponent(value.slice(base.length + 1))
  } catch {
    key = value.slice(base.length + 1)
  }
  const dir = String(exhibitDir || '').replace(/^\/+|\/+$/g, '')
  if (dir && key.startsWith(`${dir}/`)) return key.slice(dir.length + 1)
  if (/^craft-\d+\//.test(key)) return value
  return key ? `../${key}` : value
}

export function rewriteExhibitConfig(cfg, exhibitDir, cdnBase) {
  if (!cfg || typeof cfg !== 'object') return { cfg, changed: 0 }
  let changed = 0
  const touch = (obj, key) => {
    if (!obj || typeof obj[key] !== 'string') return
    const next = rewriteAssetValue(obj[key], exhibitDir, cdnBase)
    if (next !== obj[key]) {
      obj[key] = next
      changed++
    }
  }
  if (cfg.assets) {
    touch(cfg.assets, 'model')
    touch(cfg.assets, 'panorama')
    touch(cfg.assets, 'poster')
  }
  if (Array.isArray(cfg.audio)) {
    for (const track of cfg.audio) touch(track, 'src')
  }
  return { cfg, changed }
}
