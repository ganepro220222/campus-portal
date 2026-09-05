// utils/pageShare.js — 无海报页的微信转发（好友卡片 / 朋友圈）

function enablePageShare() {
  if (typeof wx === 'undefined' || typeof wx.showShareMenu !== 'function') return
  wx.showShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] })
}

function buildShareAppMessage(opts) {
  const title = String((opts && opts.title) || '云端书院')
  const path = String((opts && opts.path) || '/pages/index/index')
  const imageUrl = opts && opts.imageUrl ? String(opts.imageUrl) : ''
  const msg = { title, path }
  if (imageUrl) msg.imageUrl = imageUrl
  return msg
}

function buildShareTimeline(opts) {
  return {
    title: String((opts && opts.title) || '云端书院'),
    query: String((opts && opts.query) || '')
  }
}

function pickShareImage(source) {
  if (!source) return ''
  if (typeof source === 'string') return source
  return source.cover || source.imageUrl || source.image || ''
}

module.exports = {
  enablePageShare,
  buildShareAppMessage,
  buildShareTimeline,
  pickShareImage
}
