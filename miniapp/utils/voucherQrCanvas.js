// utils/voucherQrCanvas.js — 报名凭证二维码 Canvas 绘制
const qrcode = require('./qrcodeGenerator')

const DEFAULT_SIZE = 240

function buildMatrix(text) {
  const qr = qrcode(0, 'M')
  qr.addData(text)
  qr.make()
  return qr
}

function drawMatrix(ctx, qr, size, margin = 12) {
  const count = qr.getModuleCount()
  const cell = (size - margin * 2) / count
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#1F2547'
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) {
        ctx.fillRect(
          margin + col * cell,
          margin + row * cell,
          cell + 0.5,
          cell + 0.5
        )
      }
    }
  }
}

function renderVoucherQrToCanvas(canvas, text, size = DEFAULT_SIZE) {
  const qr = buildMatrix(text)
  const ctx = canvas.getContext('2d')
  const dpr = (typeof wx !== 'undefined' && wx.getWindowInfo)
    ? wx.getWindowInfo().pixelRatio
    : 1
  canvas.width = size * dpr
  canvas.height = size * dpr
  ctx.scale(dpr, dpr)
  drawMatrix(ctx, qr, size)
}

function exportVoucherQr(page, canvasId, text, size = DEFAULT_SIZE) {
  return new Promise((resolve, reject) => {
    wx.createSelectorQuery().in(page)
      .select(`#${canvasId}`)
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          reject(new Error('canvas not ready'))
          return
        }
        const canvas = res[0].node
        try {
          renderVoucherQrToCanvas(canvas, text, size)
        } catch (err) {
          reject(err)
          return
        }
        wx.canvasToTempFilePath({
          canvas,
          width: size,
          height: size,
          destWidth: size * 2,
          destHeight: size * 2,
          fileType: 'png',
          success: (r) => resolve(r.tempFilePath),
          fail: reject
        })
      })
  })
}

module.exports = {
  DEFAULT_SIZE,
  buildMatrix,
  drawMatrix,
  renderVoucherQrToCanvas,
  exportVoucherQr
}
