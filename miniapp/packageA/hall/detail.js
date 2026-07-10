// packageA/hall/detail.js
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const { mergeHallDetail } = require('../../utils/content')

Page({
  data: {
    hall: mergeHallDetail(null, mock.hallDetail),
    galleryIndex: 0,
    currentCaption: mock.hallDetail.caption,
    waveBars: Array.from({ length: 16 }, (_, i) => (i * 0.06).toFixed(2)),
    audioPlaying: false
  },

  onLoad(opts) {
    this._audio = null
    const id = opts && opts.id
    if (!id) return
    get(`/halls/${id}`).then(h => {
      if (h) {
        const hall = mergeHallDetail(h)
        this.setData({
          hall,
          currentCaption: hall.currentCaption || hall.caption
        })
      }
    }).catch(err => {
      console.warn('[hall/detail] 详情加载失败', err)
    })
  },

  onUnload() { this._stopAudio() },
  onHide() { this._stopAudio() },

  onGallery(e) {
    const idx = e.detail.current
    const slides = (this.data.hall && this.data.hall.slides) || []
    const cap = (slides[idx] && slides[idx].caption) || this.data.hall.caption || '左右滑动浏览，支持双指放大'
    this.setData({ galleryIndex: idx, currentCaption: cap })
  },

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

  onEnterVr() {
    const hall = this.data.hall || {}
    const url = hall.vrUrl
    if (!url || !hall.vrReady) {
      wx.showToast({ title: 'VR 链接筹备中', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/packageC/college/webview?url=' + encodeURIComponent(url)
        + '&title=' + encodeURIComponent(hall.name || 'VR展厅')
    })
  },

  onAudio() {
    const url = this.data.hall && this.data.hall.audioUrl
    if (!url) {
      wx.showToast({ title: '语音讲解即将上线', icon: 'none' })
      return
    }
    if (this.data.audioPlaying) {
      this._pauseAudio()
      return
    }
    if (!this._audio) {
      this._audio = wx.createInnerAudioContext()
      this._audio.obeyMuteSwitch = false
      this._audio.onEnded(() => this.setData({ audioPlaying: false }))
      this._audio.onStop(() => this.setData({ audioPlaying: false }))
      this._audio.onError(() => {
        this.setData({ audioPlaying: false })
        wx.showToast({ title: '语音加载失败', icon: 'none' })
      })
    }
    this._audio.src = url
    this._audio.play()
    this.setData({ audioPlaying: true })
  },

  _pauseAudio() {
    if (this._audio) {
      this._audio.pause()
    }
    this.setData({ audioPlaying: false })
  },

  _stopAudio() {
    if (this._audio) {
      this._audio.stop()
      this._audio.destroy()
      this._audio = null
    }
    this.setData({ audioPlaying: false })
  },

  onPoster() {
    const name = (this.data.hall && this.data.hall.name) || ''
    wx.navigateTo({ url: `/packageD/poster/generate?type=hall&title=${encodeURIComponent(name)}` })
  }
})
