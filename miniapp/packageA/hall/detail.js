// packageA/hall/detail.js — 展馆详情：VR + 语音 + 沉浸式章节长卷
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const { mergeHallDetail } = require('../../utils/content')
const { useMock } = require('../../utils/mockGuard')

const emptyHall = mergeHallDetail(null)

Page({
  data: {
    hall: emptyHall,
    galleryIndex: 0,
    currentCaption: '',
    waveBars: Array.from({ length: 16 }, (_, i) => (i * 0.06).toFixed(2)),
    audioPlaying: false,
    scrollProgress: 0,
    activeSectionId: '',
    scrollIntoView: ''
  },

  onLoad(opts) {
    this._audio = null
    this._sectionObserver = null
    const id = opts && opts.id
    if (!id) {
      if (useMock) this._initImmersive(mock.hallDetail)
      return
    }
    get(`/halls/${id}`).then(h => {
      if (h) {
        const demoFallback = useMock && id === '2' ? mock.hallDetail : undefined
        const hall = mergeHallDetail(h, demoFallback)
        this.setData({
          hall,
          currentCaption: hall.currentCaption || hall.caption
        })
        this._initImmersive(hall)
      }
    }).catch(err => {
      console.warn('[hall/detail] 详情加载失败', err)
    })
  },

  onReady() {
    this._setupSectionObserver()
  },

  onUnload() {
    this._stopAudio()
    this._teardownSectionObserver()
  },

  onHide() { this._pauseAudio() },

  _initImmersive(hall) {
    const sections = (hall && hall.sections) || []
    if (!sections.length) return
    const first = sections[0].anchorId || `section-${sections[0].id || 1}`
    this.setData({ activeSectionId: first })
    wx.nextTick(() => this._setupSectionObserver())
  },

  _setupSectionObserver() {
    this._teardownSectionObserver()
    const sections = (this.data.hall && this.data.hall.sections) || []
    if (!sections.length) return
    this._sectionObserver = wx.createIntersectionObserver(this, { observeAll: true })
    this._sectionObserver
      .relativeTo('.detail-scroll', { top: -120, bottom: -120 })
      .observe('.imm-section', (res) => {
        if (res.intersectionRatio > 0.2 && res.dataset.anchor) {
          this.setData({ activeSectionId: res.dataset.anchor })
        }
      })
  },

  _teardownSectionObserver() {
    if (this._sectionObserver) {
      this._sectionObserver.disconnect()
      this._sectionObserver = null
    }
  },

  onScroll(e) {
    const { scrollTop = 0, scrollHeight = 1 } = e.detail || {}
    const viewHeight = this._scrollViewHeight || 600
    const max = Math.max(1, scrollHeight - viewHeight)
    const progress = Math.min(100, Math.max(0, Math.round((scrollTop / max) * 100)))
    if (progress !== this.data.scrollProgress) {
      this.setData({ scrollProgress: progress })
    }
  },

  onSectionTap(e) {
    const anchor = e.currentTarget.dataset.anchor
    if (!anchor) return
    this.setData({ scrollIntoView: anchor, activeSectionId: anchor })
    setTimeout(() => this.setData({ scrollIntoView: '' }), 400)
  },

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
    const urls = (this.data.hall.slides || []).map(s => s.imageUrl).filter(Boolean)
    wx.previewImage({ current: url, urls: urls.length ? urls : [url] })
  },

  onPreviewSection(e) {
    const url = e.currentTarget.dataset.url
    const anchor = e.currentTarget.dataset.section
    const section = (this.data.hall.sections || []).find(s => s.anchorId === anchor)
    if (!url) {
      wx.showToast({ title: '章节高清图即将上线', icon: 'none' })
      return
    }
    const urls = (section && section.items ? section.items : [])
      .map(it => it.imageUrl)
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
    if (this._audio) this._audio.pause()
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
