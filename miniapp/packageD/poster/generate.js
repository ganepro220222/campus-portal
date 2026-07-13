// packageD/poster/generate.js — 文化分享海报生成
const { get } = require('../../utils/request')

const TEMPLATES = [
  { key: 'blue', name: '阳明蓝', c1: '#1E2654', c2: '#3F57B5', accent: '#BE9C44' },
  { key: 'ink',  name: '屯堡墨', c1: '#141A38', c2: '#2E3A66', accent: '#C9A24E' },
  { key: 'red',  name: '红韵',   c1: '#5A1E22', c2: '#A0505A', accent: '#E7C86A' },
  { key: 'gold', name: '鎏金',   c1: '#3A2E12', c2: '#8A6A2E', accent: '#F0DCA0' }
]

Page({
  data: {
    templates: TEMPLATES,
    active: 0,
    tpl: TEMPLATES[0],
    title: '云端书院 · 文化分享',
    subtitle: '传承中华优秀传统文化',
    type: '',
    saving: false
  },

  onLoad(opts) {
    const title = opts.title ? decodeURIComponent(opts.title) : this.data.title
    this.setData({ title, type: opts.type || '' })
  },

  onPick(e) {
    const i = e.currentTarget.dataset.i
    this.setData({ active: i, tpl: TEMPLATES[i] })
  },

  onSave() {
    if (this.data.saving) return
    this.setData({ saving: true })
    wx.showLoading({ title: '生成中…', mask: true })
    this._render()
      .then(tempPath => this._saveToAlbum(tempPath))
      .then(() => { wx.hideLoading(); wx.showToast({ title: '已保存到相册', icon: 'success' }) })
      .catch(err => {
        wx.hideLoading()
        if (err && err.type === 'auth') {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中开启“保存到相册”权限后重试。',
            confirmText: '去设置',
            success: (r) => { if (r.confirm) wx.openSetting() }
          })
        } else {
          wx.showToast({ title: '生成失败，请重试', icon: 'none' })
        }
        console.warn('[poster] 保存失败', err)
      })
      .then(() => this.setData({ saving: false }))
  },

  // 绘制海报到离屏 canvas，返回临时图片路径
  async _render() {
    const { tpl, title, subtitle } = this.data
    let qrBase64 = null
    try {
      const wxacode = await get('/miniapp/wxacode', { path: 'pages/index/index', width: 280 })
      if (wxacode && wxacode.available && wxacode.imageBase64) {
        qrBase64 = wxacode.imageBase64
      }
    } catch (e) {
      console.warn('[poster] 小程序码获取失败，使用占位图', e)
    }
    return new Promise((resolve, reject) => {
      wx.createSelectorQuery().in(this).select('#posterCanvas').fields({ node: true, size: true }).exec((res) => {
        if (!res || !res[0] || !res[0].node) return reject(new Error('canvas not ready'))
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio) || 2
        const W = 300, H = 500
        canvas.width = W * dpr
        canvas.height = H * dpr
        ctx.scale(dpr, dpr)

        // 背景渐变
        const grad = ctx.createLinearGradient(0, 0, W, H)
        grad.addColorStop(0, tpl.c1)
        grad.addColorStop(1, tpl.c2)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, W, H)

        // 描边内框
        ctx.strokeStyle = hexA(tpl.accent, 0.55)
        ctx.lineWidth = 1
        strokeRoundRect(ctx, 14, 14, W - 28, H - 28, 12)

        // 顶部书院名
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.font = '13px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('中 华 文 化 书 院', W / 2, 52)

        const drawRest = () => {
          // 标题（自动换行）
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 22px serif'
          const lines = wrapText(ctx, title, W - 80)
          let ty = 250
          lines.slice(0, 3).forEach((ln) => { ctx.fillText(ln, W / 2, ty); ty += 32 })

          // 分隔符
          ctx.strokeStyle = tpl.accent
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(W / 2 - 40, ty + 4)
          ctx.lineTo(W / 2 + 40, ty + 4)
          ctx.stroke()
          ctx.fillStyle = tpl.accent
          ctx.font = '12px serif'
          ctx.fillText('❖', W / 2, ty + 9)

          // 副标题
          ctx.fillStyle = 'rgba(232,240,252,0.9)'
          ctx.font = '13px sans-serif'
          ctx.fillText(subtitle, W / 2, ty + 34)

          const finishPoster = () => {
            ctx.fillStyle = 'rgba(255,255,255,0.75)'
            ctx.font = '11px sans-serif'
            ctx.fillText('长按识别小程序码 · 云端书院', W / 2, H - 26)
            wx.canvasToTempFilePath({
              canvas,
              success: (r) => resolve(r.tempFilePath),
              fail: reject
            })
          }

          if (qrBase64) {
            const qrImg = canvas.createImage()
            qrImg.onload = () => {
              const qs = 64, qx = W / 2 - qs / 2, qy = H - 108
              ctx.fillStyle = '#ffffff'
              strokeFillRoundRect(ctx, qx - 6, qy - 6, qs + 12, qs + 12, 8)
              ctx.drawImage(qrImg, qx, qy, qs, qs)
              finishPoster()
            }
            qrImg.onerror = () => {
              drawQR(ctx, W / 2 - 32, H - 108, 64, tpl.accent)
              finishPoster()
            }
            qrImg.src = 'data:image/png;base64,' + qrBase64
          } else {
            drawQR(ctx, W / 2 - 32, H - 108, 64, tpl.accent)
            finishPoster()
          }
        }

        // 徽记（尽力加载品牌图，失败则画金环占位）
        const img = canvas.createImage()
        img.onload = () => {
          const s = 96, ix = W / 2 - s / 2, iy = 90
          ctx.save()
          ctx.beginPath()
          ctx.arc(W / 2, iy + s / 2, s / 2, 0, Math.PI * 2)
          ctx.fillStyle = '#ffffff'
          ctx.fill()
          ctx.strokeStyle = tpl.accent
          ctx.lineWidth = 2
          ctx.stroke()
          ctx.clip()
          ctx.drawImage(img, ix + 8, iy + 8, s - 16, s - 16)
          ctx.restore()
          drawRest()
        }
        img.onerror = () => {
          const s = 96, iy = 90
          ctx.beginPath()
          ctx.arc(W / 2, iy + s / 2, s / 2, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255,255,255,0.14)'
          ctx.fill()
          ctx.strokeStyle = tpl.accent
          ctx.lineWidth = 2
          ctx.stroke()
          ctx.fillStyle = tpl.accent
          ctx.font = 'bold 26px serif'
          ctx.fillText('書院', W / 2, iy + s / 2 + 9)
          drawRest()
        }
        img.src = '/assets/images/school-badge.png'
      })
    })
  },

  _saveToAlbum(tempPath) {
    return new Promise((resolve, reject) => {
      wx.saveImageToPhotosAlbum({
        filePath: tempPath,
        success: resolve,
        fail: (err) => {
          const msg = (err && err.errMsg) || ''
          if (msg.indexOf('auth') >= 0 || msg.indexOf('deny') >= 0) reject({ type: 'auth' })
          else reject(err)
        }
      })
    })
  }
})

function wrapText(ctx, text, maxWidth) {
  const lines = []
  let cur = ''
  for (const ch of String(text)) {
    if (ctx.measureText(cur + ch).width > maxWidth && cur) { lines.push(cur); cur = ch }
    else cur += ch
  }
  if (cur) lines.push(cur)
  return lines
}

function strokeRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.stroke()
}

function drawQR(ctx, x, y, size, accent) {
  ctx.fillStyle = '#ffffff'
  strokeFillRoundRect(ctx, x - 6, y - 6, size + 12, size + 12, 8)
  ctx.fillStyle = '#2B356E'
  const c = size / 3.2
  // 三个定位角
  drawFinder(ctx, x + 2, y + 2, c)
  drawFinder(ctx, x + size - c - 2, y + 2, c)
  drawFinder(ctx, x + 2, y + size - c - 2, c)
  // 中心点缀
  ctx.fillStyle = accent
  ctx.fillRect(x + size / 2 - 5, y + size / 2 - 5, 10, 10)
}

function drawFinder(ctx, x, y, s) {
  ctx.fillStyle = '#2B356E'
  ctx.fillRect(x, y, s, s)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x + s * 0.22, y + s * 0.22, s * 0.56, s * 0.56)
  ctx.fillStyle = '#2B356E'
  ctx.fillRect(x + s * 0.36, y + s * 0.36, s * 0.28, s * 0.28)
}

function strokeFillRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.fill()
}

function hexA(hex, a) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
