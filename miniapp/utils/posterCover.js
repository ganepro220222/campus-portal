// utils/posterCover.js — 分享海报封面参数与布局

const BADGE_SRC = '/assets/images/school-badge.png'

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

module.exports = {
  BADGE_SRC,
  parsePosterCover,
  pickHallCover,
  pickCraftCover,
  buildPosterNavigateUrl,
  coverRect,
  titleStartY,
  roundRectPath,
  drawCoverFill
}
