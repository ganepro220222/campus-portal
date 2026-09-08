// packageA/hall/detail.js — 展馆详情：VR + 语音 + 沉浸式章节长卷
const { get } = require('../../utils/request')
const mock = require('../../mock/defaults')
const { mergeHallDetail } = require('../../utils/content')
const { buildPosterNavigateUrl, pickHallCover } = require('../../utils/posterCover')
const { useMock } = require('../../utils/mockGuard')
const { requireLogin } = require('../../utils/auth')
const { mapCollectedFromDetail, applyCollectedToggle, toggleFavorite } = require('../../utils/favoriteToggle')
const {
  buildContentDetailLoadedView,
  buildContentDetailInitialFailurePatch,
  buildContentDetailRefreshFailurePatch,
  buildContentDetailLoadingPatch,
  resolveContentDetailOnLoad,
  shouldSilentRefreshContent,
  shouldRefreshContentOnShow,
  canInteractWithContent
} = require('../../utils/contentPageInit')
const {
  IMAGE_RETRY_HINT,
  markIndexedImageFailed,
  retryIndexedImage,
  usableImageUrls,
  markNestedImageFailed,
  retryNestedImage,
  replaceField,
  slideCaption,
  previewImages
} = require('../../utils/mediaFallback')

const CONTENT_KEY = 'hall'
const GALLERY_FALLBACK = '左右滑动浏览，支持双指放大'

Page({
  data: {
    loading: true,
    loadError: false,
    notFound: false,
    refreshError: false,
    contentId: null,
    hall: null,
    galleryIndex: 0,
    currentCaption: '',
    waveBars: Array.from({ length: 16 }, (_, i) => (i * 0.06).toFixed(2)),
    audioPlaying: false,
    scrollProgress: 0,
    activeSectionId: '',
    scrollIntoView: '',
    collected: false,
    collectLabel: '收藏',
    favoriteBusy: false
  },

  onLoad(opts) {
    this._audio = null
    this._sectionObserver = null
    const entry = resolveContentDetailOnLoad(opts, { contentKey: CONTENT_KEY })
    if (!entry.shouldLoad) {
      if (useMock) {
        this._applyHall(mock.hallDetail)
        this._initImmersive(mock.hallDetail)
        return
      }
      this.setData(entry.patch)
      return
    }
    this._hallId = entry.contentId
    this.setData(entry.patch)
    this._loadDetail(entry.contentId)
  },

  onShow() {
    if (!shouldRefreshContentOnShow(this._hasShownOnce, this.data.loading)) {
      this._hasShownOnce = true
      return
    }
    const id = this.data.contentId
    if (id) this._loadDetail(id, { silent: true })
    this._hasShownOnce = true
  },

  onRetry() {
    const id = this.data.contentId
    if (!id) return
    if (this.data.loadError || this.data.notFound) {
      this._loadDetail(id)
      return
    }
    if (this.data.refreshError) {
      this.setData({ refreshError: false })
      this._loadDetail(id, { silent: true })
    }
  },

  onBackList() {
    wx.switchTab({ url: '/pages/hall/index' })
  },

  _applyHall(hall) {
    this.setData({
      hall,
      loading: false,
      loadError: false,
      notFound: false,
      refreshError: false,
      currentCaption: hall.currentCaption || hall.caption,
      ...mapCollectedFromDetail(hall)
    })
  },

  async _loadDetail(id, options = {}) {
    const { silent = false } = options
    const prev = this.data
    if (!silent) {
      this.setData(buildContentDetailLoadingPatch(CONTENT_KEY))
    }
    try {
      const raw = await get(`/halls/${id}`)
      const demoFallback = useMock && String(id) === '2' ? mock.hallDetail : undefined
      const view = buildContentDetailLoadedView(
        raw,
        id,
        CONTENT_KEY,
        (row) => mergeHallDetail(row, demoFallback),
        (row) => mapCollectedFromDetail(row)
      )
      this.setData({
        ...view,
        currentCaption: view.hall.currentCaption || view.hall.caption
      })
      this._initImmersive(view.hall)
    } catch (err) {
      console.warn('[hall/detail] 详情加载失败', err)
      if (silent && shouldSilentRefreshContent(prev, CONTENT_KEY)) {
        this.setData(buildContentDetailRefreshFailurePatch(err, prev, CONTENT_KEY))
      } else {
        this.setData(buildContentDetailInitialFailurePatch(err, CONTENT_KEY))
      }
    }
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
    const hall = this.data.hall || {}
    const slides = hall.slides || []
    const cap = slideCaption(slides[idx], hall.caption || GALLERY_FALLBACK)
    this.setData({ galleryIndex: idx, currentCaption: cap })
  },

  onSlideError(e) {
    const ds = e.currentTarget.dataset
    const hall = this.data.hall
    if (!hall) return
    const slides = markIndexedImageFailed(hall.slides, ds.index, ds.cover, ds.epoch)
    if (slides === hall.slides) return
    const patch = { hall: replaceField(hall, 'slides', slides) }
    if (Number(ds.index) === this.data.galleryIndex) {
      patch.currentCaption = IMAGE_RETRY_HINT
    }
    this.setData(patch)
  },

  onSectionImageError(e) {
    const ds = e.currentTarget.dataset
    const hall = this.data.hall
    if (!hall) return
    const sections = markNestedImageFailed(hall.sections, ds.sidx, ds.midx, ds.cover, ds.epoch)
    if (sections === hall.sections) return
    this.setData({ hall: replaceField(hall, 'sections', sections) })
  },

  onPreviewSlide(e) {
    const idx = e.currentTarget.dataset.index
    const hall = this.data.hall || {}
    const slides = hall.slides || []
    const slide = slides[idx]
    if (!slide || !slide.imageUrl) {
      wx.showToast({ title: '展馆高清图即将上线', icon: 'none' })
      return
    }
    if (slide.imageFailed) {
      const next = retryIndexedImage(slides, idx)
      if (next === slides) return
      const patch = { hall: replaceField(hall, 'slides', next) }
      if (Number(idx) === this.data.galleryIndex) {
        patch.currentCaption = slideCaption(next[idx], hall.caption || GALLERY_FALLBACK)
      }
      this.setData(patch)
      return
    }
    previewImages(wx, usableImageUrls(slides), slide.imageUrl)
  },

  onPreviewSection(e) {
    const ds = e.currentTarget.dataset
    const hall = this.data.hall || {}
    const sections = hall.sections || []
    const si = Number(ds.sidx)
    const mi = Number(ds.midx)
    const section = sections[si]
    const media = section && section.items && section.items[mi]
    if (!media || !media.imageUrl) {
      wx.showToast({ title: '章节高清图即将上线', icon: 'none' })
      return
    }
    if (media.imageFailed) {
      const next = retryNestedImage(sections, si, mi)
      if (next !== sections) this.setData({ hall: replaceField(hall, 'sections', next) })
      return
    }
    previewImages(wx, usableImageUrls(section.items), media.imageUrl)
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
    const hall = this.data.hall || {}
    wx.navigateTo({
      url: buildPosterNavigateUrl({
        type: 'hall',
        title: hall.name || '',
        subtitle: '线上展馆 · 沉浸式文化体验',
        cover: pickHallCover(hall)
      })
    })
  },

  onCollect() {
    if (!canInteractWithContent(this.data, CONTENT_KEY, 'contentId')) return
    const id = this.data.contentId || this._hallId
    if (!id) return
    requireLogin(() => {
      if (this.data.favoriteBusy) return
      this.setData({ favoriteBusy: true })
      toggleFavorite('hall', id).then(res => {
        const patch = applyCollectedToggle(this.data, res)
        this.setData({ ...patch, favoriteBusy: false })
        if (patch.collected) wx.showToast({ title: '收藏成功', icon: 'none' })
      }).catch(() => {
        this.setData({ favoriteBusy: false })
        wx.showToast({ title: '操作失败', icon: 'none' })
      })
    })
  }
})
