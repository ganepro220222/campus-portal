// utils/posterCover.js — 分享海报封面参数与布局

const BADGE_SRC = '/assets/images/academy-seal-navy.png'

function parsePosterCover(raw) {
  if (raw == null || raw === '') return ''
  try {
    const url = decodeURIComponent(String(raw)).trim()
    return /^https?:\/\//i.test(url) ? url : ''
  } catch (e) {
    return ''
  }
}

function pickHallCover(hall) {
  const slides = hall && hall.slides
  if (!slides || !slides.length) return ''
  return (slides[0].imageUrl || '').trim()
}

function pickCraftCover(detail) {
  const images = detail && detail.images
  if (!images || !images.length) return ''
  return (images[0].imageUrl || '').trim()
}

function buildPosterNavigateUrl({ type, title, subtitle, cover }) {
  const params = []
  if (type) params.push(`type=${encodeURIComponent(type)}`)
  if (title) params.push(`title=${encodeURIComponent(title)}`)
  if (subtitle) params.push(`subtitle=${encodeURIComponent(subtitle)}`)
  const coverUrl = parsePosterCover(cover)
  if (coverUrl) params.push(`cover=${encodeURIComponent(coverUrl)}`)
  return `/packageD/poster/generate?${params.join('&')}`
}

function coverRect(canvasWidth) {
  const w = 220
  const h = 124
  return {
    x: (canvasWidth - w) / 2,
    y: 58,
    w,
    h,
    r: 10
  }
}

/*
 * 标题首行基线的 y（画布 300×500）。
 *
 * 约束来自下方：副标题基线 = titleStartY + 32×行数 + 34，而二维码白底板从 y=386 开始，
 * 标题最多画 3 行（drawRest 里 lines.slice(0, 3)）。所以必须满足
 *   titleStartY + 32×3 + 34 + 3(降部) <= 386  →  titleStartY <= 253。
 *
 * 无封面的 250 就是照这条卡出来的（3 行时只剩 3px 余量）。有封面时曾取 318，
 * 那是只顾着「让标题离封面远一点」、没回头核算下边界：1 行就压线，2 行起副标题
 * 直接画在二维码上——海报是要分享出去被人扫的，糊住码等于废掉这张图。
 *
 * 235 是按上边界定的：封面 y 58..182，右下角徽记圆底部到 y=195，
 * 235 的墨迹顶部约 213，留 18px；下边界 3 行时副标题落在 365，离底板还有 21px。
 */
function titleStartY(hasCover) {
  return hasCover ? 235 : 250
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/*
 * 徽记按 aspectFit 落进圆内。
 *
 * 原来是 ctx.drawImage(badge, x, y, box, box) 直接画成正方形——校徽本身就是 1:1，
 * 看不出问题；换成 560×499 的篆印后会被压扁。这里按图片真实比例算，
 * 不硬编码 1.122，换素材也不用回来改。
 */
function badgeFitRect(imgW, imgH, box) {
  const w = Number(imgW)
  const h = Number(imgH)
  if (!(w > 0) || !(h > 0) || !(box > 0)) return { w: box, h: box }
  const r = w / h
  return r >= 1 ? { w: box, h: box / r } : { w: box * r, h: box }
}

function drawCoverFill(ctx, img, rect) {
  const { x, y, w, h } = rect
  const ir = img.width / img.height
  const br = w / h
  let dw
  let dh
  let dx
  let dy
  if (ir > br) {
    dh = h
    dw = h * ir
    dx = x + (w - dw) / 2
    dy = y
  } else {
    dw = w
    dh = w / ir
    dx = x
    dy = y + (h - dh) / 2
  }
  ctx.drawImage(img, dx, dy, dw, dh)
}

/*
 * 标题折行：贪心折行会把「贵州交通博物馆 · 教育馆」断成「……教育」+「馆」，
 * 末行只剩一个字，海报上很难看。
 *
 * 做法是「先定行数，再把行数压到最窄」：
 *   1. 用整幅可用宽度贪心折一遍，得到最少需要几行 n；
 *   2. 二分找出「仍然只折成 n 行」的最小宽度 W；
 *   3. 按 W 折出来的行自然就均匀了——想让某行更短，就必须多出一行。
 * 这样既不会多占行数，也不会出现孤字。
 *
 * measure 由调用方给：画布传 ctx.measureText().width，预览可以传同一套
 * （海报预览 400rpx 宽配 40rpx 字、画布 220px 宽配 22px 字，都是 10em，
 * 所以一次测算两边通用）。
 */
function greedyWrap(text, maxWidth, measure) {
  const lines = []
  let cur = ''
  for (const ch of String(text)) {
    if (cur && measure(cur + ch) > maxWidth) { lines.push(cur); cur = ch }
    else cur += ch
  }
  if (cur) lines.push(cur)
  return lines
}

function balanceLines(text, maxWidth, measure, maxLines) {
  const raw = String(text == null ? '' : text)
  if (!raw) return ['']
  if (!(maxWidth > 0) || typeof measure !== 'function') return [raw]

  const full = greedyWrap(raw, maxWidth, measure)
  const cap = maxLines > 0 ? maxLines : full.length
  // 超出上限时不再均衡：多余的行会被调用方截掉，压窄反而把内容挤到被截的行里
  if (full.length <= 1 || full.length > cap) return full

  const n = full.length
  let lo = 1
  let hi = maxWidth
  let best = full
  // 宽度是连续量，二分到 0.5px 以内即可，行数只会在离散点上跳变
  for (let i = 0; i < 40 && hi - lo > 0.5; i++) {
    const mid = (lo + hi) / 2
    const lines = greedyWrap(raw, mid, measure)
    if (lines.length <= n) { best = lines; hi = mid } else { lo = mid }
  }
  return best
}

module.exports = {
  BADGE_SRC,
  greedyWrap,
  balanceLines,
  parsePosterCover,
  pickHallCover,
  pickCraftCover,
  buildPosterNavigateUrl,
  coverRect,
  titleStartY,
  badgeFitRect,
  roundRectPath,
  drawCoverFill
}
