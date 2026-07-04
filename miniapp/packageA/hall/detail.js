// packageA/hall/detail.js —— 展馆详情（对齐 demo 展馆栏）
const { get } = require('../../utils/request')

const DEFAULT = {
  name: '阳明文化馆',
  slides: [
    { cls: 'gi1', icon: 'museum' },
    { cls: 'gi2', icon: 'star' },
    { cls: 'gi3', icon: 'book' }
  ],
  caption: '阳明先生像 · 龙场悟道（左右滑动浏览，支持双指放大）',
  audioTime: '语音讲解 03:48',
  intro: '王阳明谪居贵州龙场期间，于困顿中悟“格物致知”之旨，史称“龙场悟道”，由此奠定心学体系。本馆以图文、实景与多媒体相结合的方式，系统呈现阳明先生的生平、思想脉络及其在黔中大地的深远影响，引导师生在沉浸式浏览中体悟“知行合一”的精神品格。'
}

Page({
  data: {
    hall: DEFAULT,
    galleryIndex: 0,
    waveBars: Array.from({ length: 16 }, (_, i) => (i * 0.06).toFixed(2))
  },

  onLoad(opts) {
    const id = opts && opts.id
    if (!id) return
    get(`/halls/${id}`).then(h => {
      if (h) this.setData({ hall: { ...DEFAULT, ...h } })
    }).catch(() => {})
  },

  onGallery(e) { this.setData({ galleryIndex: e.detail.current }) },
  onAudio() { wx.showToast({ title: '语音讲解播放中', icon: 'none' }) },
  onPoster() { wx.showToast({ title: '正在生成专属文化海报…', icon: 'none' }) }
})
