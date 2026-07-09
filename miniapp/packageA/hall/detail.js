// packageA/hall/detail.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const { mergeHallDetail } = require('../../utils/content')

Page({
  data: {
    hall: mock.hallDetail,
    galleryIndex: 0,
    waveBars: Array.from({ length: 16 }, (_, i) => (i * 0.06).toFixed(2))
  },

  onLoad(opts) {
    const id = opts && opts.id
    if (!id) return
    get(`/halls/${id}`).then(h => {
      if (h) this.setData({ hall: mergeHallDetail(h) })
    }).catch(err => {
      console.warn('[hall/detail] 详情加载失败', err)
    })
  },

  onGallery(e) { this.setData({ galleryIndex: e.detail.current }) },

  onPreviewSlide(e) {
    const url = e.currentTarget.dataset.url
    if (!url) {
      wx.showToast({ title: '展馆高清图即将上线', icon: 'none' })
      return
    }
    const urls = (this.data.hall.slides || [])
      .map(s => s.imageUrl)
      .filter(Boolean)
    wx.previewImage({ current: url, urls: urls.length ? urls : [url] })
  },

  onAudio() { wx.showToast({ title: '语音讲解播放中', icon: 'none' }) },
  onPoster() {
    const name = (this.data.hall && this.data.hall.name) || ''
    wx.navigateTo({ url: `/packageD/poster/generate?type=hall&title=${encodeURIComponent(name)}` })
  }
})
