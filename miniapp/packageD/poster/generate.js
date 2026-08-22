// packageD/poster/generate.js — 分享海报生成
const { get } = require('../../utils/request')
const { parseWxacodeResponse } = require('../../utils/wxacode')
const {
  BADGE_SRC,
  parsePosterCover,
  coverRect,
  titleStartY,
  roundRectPath,
  drawCoverFill,
  badgeFitRect
} = require('../../utils/posterCover')

const TEMPLATES = [
  { key: 'blue', name: '阳明蓝', c1: '#1E2654', c2: '#3F57B5', accent: '#BE9C44' },
  { key: 'ink',  name: '屯堡墨', c1: '#141A38', c2: '#2E3A66', accent: '#C9A24E' },
  { key: 'red',  name: '红韵',   c1: '#5A1E22', c2: '#A0505A', accent: '#E7C86A' },
  { key: 'gold', name: '鎏金',   c1: '#3A2E12', c2: '#8A6A2E', accent: '#F0DCA0' }
]

const WXACODE_ERR = { type: 'wxacode' }

Page({
  data: {
    templates: TEMPLATES,
    active: 0,
    tpl: TEMPLATES[0],
    // 无参进入时的默认文案；文创/展馆入口会传入 title 覆盖。
    title: '云端书院',
    subtitle: '线上展馆 · 精品课程 · 文创展示',
    type: '',
    coverUrl: '',
    hasCover: false,
    saving: false
  },

  onLoad(opts) {
    const title = opts.title ? decodeURIComponent(opts.title) : this.data.title
    const subtitle = opts.subtitle ? decodeURIComponent(opts.subtitle) : this.data.subtitle
    const coverUrl = parsePosterCover(opts.cover)
    this.setData({
      title,
      subtitle,
      type: opts.type || '',
      coverUrl,
      hasCover: !!coverUrl
    })
  },

  /*
   * 封面拿不到图时，画布侧 coverImg.onerror 会降级成「居中徽记」布局；
   * 预览侧原来只看 URL 合不合法、不看图片是否真的加载得出来，于是预览留一个空白灰框、
   * 存下来的图却是徽记布局——预览即成品在这里断了。让预览跟着降级。
   */
  onCoverError() {
    if (!this.data.hasCover) return
    console.warn('[poster] 封面加载失败，预览降级为徽记布局')
    this.setData({ hasCover: false, coverUrl: '' })
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
        } else if (err && err.type === 'wxacode') {
          wx.showToast({ title: '小程序码生成失败，请检查网络后重试', icon: 'none', duration: 2800 })
        } else {
          wx.showToast({ title: '生成失败，请重试', icon: 'none' })
        }
        console.warn('[poster] 保存失败', err)
      })
      .then(() => this.setData({ saving: false }))
  },

  async _fetchWxacodeBase64() {
    let payload
    try {
      payload = await get('/miniapp/wxacode', { path: 'pages/index/index', width: 280 })
    } catch (e) {
      console.warn('[poster] 小程序码接口请求失败', e)
      throw WXACODE_ERR
    }
    const parsed = parseWxacodeResponse(payload)
    if (!parsed.ok) {
      console.warn('[poster] 小程序码不可用', parsed.reason)
      throw WXACODE_ERR
    }
    return parsed.base64
  },

  // 绘制海报到离屏 canvas；必须成功嵌入可识别的小程序码
  async _render() {
    const qrBase64 = await this._fetchWxacodeBase64()
    const { tpl, title, subtitle, coverUrl } = this.data

    return new Promise((resolve, reject) => {
      wx.createSelectorQuery().in(this).select('#posterCanvas').fields({ node: true, size: true }).exec((res) => {
        if (!res || !res[0] || !res[0].node) return reject(new Error('canvas not ready'))
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = (wx.getWindowInfo && wx.getWindowInfo().pixelRatio) || 2
        const W = 300
        const H = 500
        canvas.width = W * dpr
        canvas.height = H * dpr
        ctx.scale(dpr, dpr)

        const grad = ctx.createLinearGradient(0, 0, W, H)
        grad.addColorStop(0, tpl.c1)
        grad.addColorStop(1, tpl.c2)
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, W, H)

        ctx.strokeStyle = hexA(tpl.accent, 0.55)
        ctx.lineWidth = 1
        strokeRoundRect(ctx, 14, 14, W - 28, H - 28, 12)

        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.font = '13px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('中 华 文 化 书 院', W / 2, 52)

        const drawRest = (startY) => {
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 22px serif'
          const lines = wrapText(ctx, title, W - 80)
          let ty = startY
          lines.slice(0, 3).forEach((ln) => { ctx.fillText(ln, W / 2, ty); ty += 32 })

          ctx.strokeStyle = tpl.accent
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(W / 2 - 40, ty + 4)
          ctx.lineTo(W / 2 + 40, ty + 4)
          ctx.stroke()
          ctx.fillStyle = tpl.accent
          ctx.font = '12px serif'
          ctx.fillText('❖', W / 2, ty + 9)

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

          const qrImg = canvas.createImage()
          qrImg.onload = () => {
            const qs = 64
            const qx = W / 2 - qs / 2
            const qy = H - 108
            ctx.fillStyle = '#ffffff'
            strokeFillRoundRect(ctx, qx - 6, qy - 6, qs + 12, qs + 12, 8)
            ctx.drawImage(qrImg, qx, qy, qs, qs)
            finishPoster()
          }
          qrImg.onerror = () => {
            console.warn('[poster] 小程序码图片解码失败')
            reject(WXACODE_ERR)
          }
          qrImg.src = 'data:image/png;base64,' + qrBase64
        }

        /* 印面是方的，牌子也画成圆角方形——圆牌配方印两种形状打架。
           圆角比 0.226、印面占比 0.70，与预览的 .p-seal / .p-cover-badge 一致。 */
        const drawBadgePlate = (cx, cy, size) => {
          const half = size / 2
          const radius = size * 0.226
          const plate = () => roundRectPath(ctx, cx - half, cy - half, size, size, radius)
          return new Promise((resolveBadge) => {
            const badge = canvas.createImage()
            badge.onload = () => {
              ctx.save()
              plate()
              ctx.fillStyle = '#ffffff'
              ctx.fill()
              ctx.strokeStyle = tpl.accent
              ctx.lineWidth = 2
              ctx.stroke()
              ctx.clip()
              const fit = badgeFitRect(badge.width, badge.height, size * 0.70)
              ctx.drawImage(badge, cx - fit.w / 2, cy - fit.h / 2, fit.w, fit.h)
              ctx.restore()
              resolveBadge()
            }
            badge.onerror = () => {
              plate()
              ctx.fillStyle = 'rgba(255,255,255,0.14)'
              ctx.fill()
              ctx.strokeStyle = tpl.accent
              ctx.lineWidth = 2
              ctx.stroke()
              ctx.fillStyle = tpl.accent
              ctx.font = 'bold 18px serif'
              ctx.fillText('書院', cx, cy + 6)
              resolveBadge()
            }
            badge.src = BADGE_SRC
          })
        }

        const startHero = () => {
          if (!coverUrl) {
            drawBadgePlate(W / 2, 90 + 48, 96).then(() => drawRest(titleStartY(false)))
            return
          }
          const rect = coverRect(W)
          const coverImg = canvas.createImage()
          coverImg.onload = () => {
            ctx.save()
            roundRectPath(ctx, rect.x, rect.y, rect.w, rect.h, rect.r)
            ctx.clip()
            drawCoverFill(ctx, coverImg, rect)
            ctx.restore()
            ctx.strokeStyle = hexA(tpl.accent, 0.85)
            ctx.lineWidth = 2
            strokeRoundRect(ctx, rect.x, rect.y, rect.w, rect.h, rect.r)
            const badgeSize = 52
            const bx = rect.x + rect.w - badgeSize * 0.35
            const by = rect.y + rect.h - badgeSize * 0.25
            drawBadgePlate(bx, by, badgeSize).then(() => drawRest(titleStartY(true)))
          }
          coverImg.onerror = () => {
            console.warn('[poster] 封面加载失败，降级为校徽布局')
            drawBadgePlate(W / 2, 90 + 48, 96).then(() => drawRest(titleStartY(false)))
          }
          coverImg.src = coverUrl
        }

        startHero()
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
