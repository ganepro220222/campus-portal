// packageA/craft/detail.js — 文创详情逻辑
const { get } = require('../../utils/request')
const { mergeCraftDetail } = require('../../utils/content')
const mock = require('../../mock/defaults')

const COVER_CLASSES = ['gi1', 'gi2', 'gi3']

Page({
  data: {
    craftId: null,
    detail: mock.craftDetail,
    slides: buildSlides(mock.craftDetail),
    galleryIndex: 0
  },

  onLoad(opts) {
    const id = opts.id
    this.setData({ craftId: id })
    if (id) this._loadDetail(id)
  },

  async _loadDetail(id) {
    try {
      const raw = await get(`/crafts/${id}`).catch(() => null)
      const detail = mergeCraftDetail(raw, mock.craftDetail)
      this.setData({ detail, slides: buildSlides(detail) })
    } catch (err) {
      console.warn('[craft/detail] 加载失败', err)
      this.setData({ detail: mock.craftDetail, slides: buildSlides(mock.craftDetail) })
    }
  },

  onGallery(e) { this.setData({ galleryIndex: e.detail.current }) },

  onPreview(e) {
    const url = e.currentTarget.dataset.url
    if (!url) {
      wx.showToast({ title: '高清图即将上线', icon: 'none' })
      return
    }
    const urls = (this.data.detail.images || []).map(s => s.imageUrl).filter(Boolean)
    wx.previewImage({ current: url, urls: urls.length ? urls : [url] })
  },

  onCopy(e) {
    const val = e.currentTarget.dataset.val
    if (!val) return
    wx.setClipboardData({ data: String(val), success() { wx.showToast({ title: '已复制', icon: 'none' }) } })
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
  const icon = (detail && detail.previewType === 'model3d') ? 'museum' : 'medal'
  return imgs.map((img, i) => ({
    cls: COVER_CLASSES[i % COVER_CLASSES.length],
    icon,
    imageUrl: img.imageUrl || '',
    angleLabel: img.angleLabel || `视角 ${i + 1}`
  }))
}
