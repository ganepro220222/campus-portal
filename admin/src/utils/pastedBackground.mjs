/**
 * 去掉粘贴带来的近白背景（min≥240 且色差≤12）。
 * 荧光笔与含 url() 的 background 保留。与 miniapp/utils/content.js 同逻辑。
 */

/** 是否为粘贴常见的近白底色 */
export function isPastedWhite(color) {
  const t = String(color || '').trim().toLowerCase()
  if (!t) return false
  if (t === 'white' || t === 'transparent') return true
  let rgb = null
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(t)
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split('').map((c) => c + c).join('') : hex[1]
    rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  }
  const fn = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(t)
  if (fn) rgb = [+fn[1], +fn[2], +fn[3]]
  if (!rgb) return false
  const lo = Math.min(rgb[0], rgb[1], rgb[2])
  const hi = Math.max(rgb[0], rgb[1], rgb[2])
  return lo >= 240 && hi - lo <= 12
}

/** 摘掉内联 style 里的近白背景；style 空了则去掉该属性 */
export function dropPastedBackgrounds(html) {
  if (!html) return ''
  return String(html).replace(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi, (full, _q, dq, sq) => {
    const raw = dq !== undefined ? dq : sq
    const kept = raw.split(';').filter((decl) => {
      const m = /^\s*(background|background-color)\s*:\s*([\s\S]+)$/i.exec(decl)
      if (!m) return true
      if (/url\(/i.test(m[2])) return true        // 背景图，别碰
      return !isPastedWhite(m[2])
    })
    const out = kept.join(';').replace(/^;+|;+$/g, '').trim()
    return out ? ' style="' + out + '"' : ''
  })
}
