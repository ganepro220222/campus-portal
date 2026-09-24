/**
 * 去掉从别处粘进编辑器的**白底**。
 *
 * 真出过：后台编辑的动态发到小程序上，每一段正文背后都拖着一块纯白，
 * 而页面的纸是 #F7F3E8。量过用户的截图：底 #F7F3E8 占 407 行、
 * 纯 #FFFFFF 占 237 行；#FFFFFF 不在那套令牌里的任何一个——
 * 不是小程序画的，是正文自带的。从公众号 / Word / 网页里粘进来的内容，
 * 常在 <p>/<span>/<section> 上带着 `background:#fff`；WangEditor 不过滤
 * 内联样式（没开 pasteFilterStyle，bgColor 也没禁），入库时 sanitizeRichHtml
 * 也只管 script/iframe/on*，于是这块白一路跟到 <rich-text> 上被忠实画出。
 *
 * 只删**浅且近中性**的那一档：
 *   浅  —— 三个通道的最小值 ≥ 240
 *   中性 —— 最大通道减最小通道 ≤ 12
 * 纯白、#FAFAFA、rgb(255,255,255) 都清掉，而作者**有意**打的荧光笔
 * （黄、绿这类饱和色）留得住——那是排版意图，不该替人做主。
 * 值里带 url() 的一概不动：那是背景图，改不干净不如不改。
 *
 * ⚠ 小程序端 miniapp/utils/content.js 里有一份一模一样的实现（两个包不能互相
 *   import：小程序是独立的 CommonJS 包）。两边必须同步，
 *   scripts/test-pasted-background-parity.mjs 会拿同一张用例表逐条比对。
 */

/** 这个颜色算不算「粘来的白」——浅且近中性 */
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

/** 把内联 style 里的白底声明摘掉；style 摘空了就连属性一起去掉 */
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
