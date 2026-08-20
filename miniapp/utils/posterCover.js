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

function titleStartY(hasCover) {
  return hasCover ? 318 : 250
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
