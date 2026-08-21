// packageA/craft/detail.js — 文创详情：多角度图片 + 中英文切换
const { get } = require('../../utils/request')
const { mergeCraftDetail } = require('../../utils/content')
const { buildPosterNavigateUrl, pickCraftCover } = require('../../utils/posterCover')
const mock = require('../../mock/defaults')
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

const CONTENT_KEY = 'detail'
const COVER_CLASSES = ['gi1', 'gi2', 'gi3']

Page({
  data: {
    loading: true,
    loadError: false,
    notFound: false,
    refreshError: false,
    contentId: null,
    craftId: null,
    detail: null,
    slides: [],
    galleryIndex: 0,
    lang: 'zh',
    collected: false,
    collectLabel: '收藏'
  },

  onLoad(opts) {
    const entry = resolveContentDetailOnLoad(opts, { contentKey: CONTENT_KEY })
    this.setData({
      ...entry.patch,
      craftId: entry.contentId
    })
    if (!entry.shouldLoad) return
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
    wx.navigateTo({ url: '/packageA/craft/list' })
  },

  _fallbackForId(id) {
    if (!useMock) return undefined
    return mock.craftDetail
  },

  _applyDetail(detail) {
    this.setData({
      detail,
      slides: buildSlides(detail),
      galleryIndex: 0,
      ...mapCollectedFromDetail(detail)
    })
  },

  async _loadDetail(id, options = {}) {
    const { silent = false } = options
    const prev = this.data
    const fallback = this._fallbackForId(id)
    if (!silent) {
      this.setData(buildContentDetailLoadingPatch(CONTENT_KEY))
    }
    try {
      const raw = await get(`/crafts/${id}`)
      const view = buildContentDetailLoadedView(
        raw,
        id,
        CONTENT_KEY,
        (row) => mergeCraftDetail(row, fallback),
        (row) => mapCollectedFromDetail(row)
      )
      this.setData({
        ...view,
        craftId: id,
        slides: buildSlides(view.detail),
        galleryIndex: 0
      })
    } catch (err) {
      console.warn('[craft/detail] 加载失败', err)
      if (silent && shouldSilentRefreshContent(prev, CONTENT_KEY)) {
        this.setData(buildContentDetailRefreshFailurePatch(err, prev, CONTENT_KEY))
      } else {
        this.setData(buildContentDetailInitialFailurePatch(err, CONTENT_KEY))
      }
    }
  },

  onGallery(e) { this.setData({ galleryIndex: e.detail.current }) },

  onLangSwitch(e) {
    if (!canInteractWithContent(this.data, CONTENT_KEY, 'contentId')) return
    const lang = e.currentTarget.dataset.lang
    if (!lang || lang === this.data.lang) return
    if (lang === 'en' && !this.data.detail.introEn) {
      wx.showToast({ title: '暂无英文介绍', icon: 'none' })
      return
    }
    this.setData({ lang })
  },

  onPreview(e) {
    if (!canInteractWithContent(this.data, CONTENT_KEY, 'contentId')) return
    const url = e.currentTarget.dataset.url
    if (!url) {
      wx.showToast({ title: '高清图即将上线', icon: 'none' })
      return
    }
    const urls = (this.data.detail.images || []).map(s => s.imageUrl).filter(Boolean)
    wx.previewImage({ current: url, urls: urls.length ? urls : [url] })
  },

  onPhone(e) {
    if (!canInteractWithContent(this.data, CONTENT_KEY, 'contentId')) return
    const phone = e.currentTarget.dataset.val
    if (!phone) return
    wx.makePhoneCall({
      phoneNumber: String(phone),
      fail() { wx.showToast({ title: '拨号失败', icon: 'none' }) }
    })
  },

  onCopy(e) {
    if (!canInteractWithContent(this.data, CONTENT_KEY, 'contentId')) return
    const val = e.currentTarget.dataset.val
    if (!val) return
    wx.setClipboardData({
      data: String(val),
      success() { wx.showToast({ title: '已复制', icon: 'none' }) }
    })
  },

  onPoster() {
    if (!canInteractWithContent(this.data, CONTENT_KEY, 'contentId')) return
    const d = this.data.detail || {}
    wx.navigateTo({
      url: buildPosterNavigateUrl({
        type: 'craft',
        title: d.name || '',
        subtitle: '精品好物 · 书院文创展示',
        cover: pickCraftCover(d)
      })
    })
  },

  onCollect() {
    if (!canInteractWithContent(this.data, CONTENT_KEY, 'contentId')) return
    const id = this.data.contentId
    requireLogin(() => {
      toggleFavorite('craft', id).then(res => {
        const patch = applyCollectedToggle(this.data, res)
        this.setData(patch)
        if (patch.collected) wx.showToast({ title: '收藏成功', icon: 'none' })
      })
    })
  }
})

function buildSlides(detail) {
  const imgs = (detail && detail.images && detail.images.length)
    ? detail.images
    : [{ imageUrl: '', angleLabel: '正面' }]
  return imgs.map((img, i) => ({
    cls: COVER_CLASSES[i % COVER_CLASSES.length],
    icon: 'medal',
    imageUrl: img.imageUrl || '',
    angleLabel: img.angleLabel || `视角 ${i + 1}`
  }))
}
