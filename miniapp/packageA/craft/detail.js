// packageA/craft/detail.js — 文创详情：多角度图片 + 中英文切换
const { get } = require('../../utils/request')
const { mergeCraftDetail } = require('../../utils/content')
const mock = require('../../mock/defaults')
const { useMock } = require('../../utils/mockGuard')

const COVER_CLASSES = ['gi1', 'gi2', 'gi3']

Page({
  data: {
    craftId: null,
    detail: mergeCraftDetail(null),
    slides: [],
    galleryIndex: 0,
    lang: 'zh'
  },

  onLoad(opts) {
    const id = opts.id
    this.setData({ craftId: id })
    if (id) this._loadDetail(id)
  },

  _fallbackForId(id) {
    if (!useMock) return {}
    return mock.craftDetail
  },

  _applyDetail(detail) {
    this.setData({
      detail,
      slides: buildSlides(detail),
      galleryIndex: 0
    })
  },

  async _loadDetail(id) {
    const fallback = this._fallbackForId(id)
    try {
      const raw = await get(`/crafts/${id}`).catch(() => null)
      const detail = mergeCraftDetail(raw, fallback)
      this._applyDetail(detail)
    } catch (err) {
      console.warn('[craft/detail] 加载失败', err)
      this._applyDetail(mergeCraftDetail(null, fallback))
    }
  },

  onGallery(e) { this.setData({ galleryIndex: e.detail.current }) },

  onLangSwitch(e) {
    const lang = e.currentTarget.dataset.lang
    if (!lang || lang === this.data.lang) return
    if (lang === 'en' && !this.data.detail.introEn) {
      wx.showToast({ title: '暂无英文介绍', icon: 'none' })
      return
    }
    this.setData({ lang })
  },

  onPreview(e) {
    const url = e.currentTarget.dataset.url
    if (!url) {
      wx.showToast({ title: '高清图即将上线', icon: 'none' })
      return
    }
    const urls = (this.data.detail.images || []).map(s => s.imageUrl).filter(Boolean)
    wx.previewImage({ current: url, urls: urls.length ? urls : [url] })
  },

  onPhone(e) {
    const phone = e.currentTarget.dataset.val
    if (!phone) return
    wx.makePhoneCall({
      phoneNumber: String(phone),
      fail() { wx.showToast({ title: '拨号失败', icon: 'none' }) }
    })
  },

  onCopy(e) {
    const val = e.currentTarget.dataset.val
    if (!val) return
    wx.setClipboardData({
      data: String(val),
      success() { wx.showToast({ title: '已复制', icon: 'none' }) }
    })
  },

  onPoster() {
    const d = this.data.detail || {}
    wx.navigateTo({ url: `/packageD/poster/generate?type=craft&title=${encodeURIComponent(d.name || '')}` })
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
