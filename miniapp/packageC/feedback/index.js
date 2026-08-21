// packageC/feedback/index.js — 意见反馈（需登录，与后端一致）
const { getToken } = require('../../utils/auth')
const { post, upload } = require('../../utils/request')
const {
  MAX_IMAGES,
  normalizeUploadedUrl,
  buildSubmitImages,
  remainingSlots
} = require('../../utils/feedbackImages')
const {
  canAccessFeedback,
  resolveUploadErrorMessage
} = require('../../utils/feedbackPage')

const TYPES = ['功能建议', '内容纠错', '使用问题', '其他']

Page({
  data: {
    types: TYPES,
    typeIndex: 0,
    content: '',
    contact: '',
    images: [],
    submitting: false,
    maxImages: MAX_IMAGES
  },

  onLoad() {
    if (!canAccessFeedback(!!getToken())) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        wx.navigateBack({
          fail: () => wx.navigateTo({ url: '/pages/login/index' })
        })
      }, 400)
    }
  },

  onType(e) { this.setData({ typeIndex: Number(e.currentTarget.dataset.i) }) },
  onContent(e) { this.setData({ content: e.detail.value }) },
  onContact(e) { this.setData({ contact: e.detail.value }) },

  onChooseImages() {
    if (!canAccessFeedback(!!getToken())) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => wx.navigateTo({ url: '/pages/login/index' }), 400)
      return
    }
    const left = remainingSlots(this.data.images.length)
    if (left <= 0) {
      wx.showToast({ title: `最多上传 ${MAX_IMAGES} 张`, icon: 'none' })
      return
    }
    wx.chooseImage({
      count: left,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const paths = res.tempFilePaths || []
        paths.forEach(p => this._uploadOne(p))
      }
    })
  },

  _uploadOne(localPath) {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    this.setData({ images: this.data.images.concat([{ id, localPath, url: '', uploading: true }]) })
    upload('/miniapp/upload', localPath, 'file', {}, { silent: true }).then((data) => {
      const url = normalizeUploadedUrl(data)
      if (!url) throw new Error('invalid upload url')
      this._patchImage(id, { url, uploading: false })
    }).catch((err) => {
      this._patchImage(id, { uploading: false, failed: true })
      wx.showToast({ title: resolveUploadErrorMessage(err), icon: 'none', duration: 2800 })
    })
  },

  _patchImage(id, patch) {
    const images = this.data.images.map(it => (it.id === id ? { ...it, ...patch } : it))
    this.setData({ images })
  },

  onRemoveImage(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ images: this.data.images.filter(it => it.id !== id) })
  },

  onPreviewImage(e) {
    const current = e.currentTarget.dataset.src
    const urls = this.data.images
      .map(it => it.url || it.localPath)
      .filter(Boolean)
    if (!urls.length) return
    wx.previewImage({ current, urls })
  },

  onSubmit() {
    if (!canAccessFeedback(!!getToken())) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => wx.navigateTo({ url: '/pages/login/index' }), 400)
      return
    }
    const { content, types, typeIndex, contact, submitting, images } = this.data
    if (submitting) return
    if (!content.trim()) return wx.showToast({ title: '请填写反馈内容', icon: 'none' })
    if (images.some(it => it.uploading)) {
      return wx.showToast({ title: '图片上传中，请稍候', icon: 'none' })
    }

    const imageUrls = buildSubmitImages(images.filter(it => !it.failed))
    const payload = {
      type: types[typeIndex],
      content: content.trim(),
      contact: contact.trim()
    }
    if (imageUrls.length) payload.images = imageUrls

    this.setData({ submitting: true })
    post('/feedback', payload).then(() => {
      this.setData({ submitting: false })
      wx.showToast({ title: '感谢反馈，已提交', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 1200)
    }).catch(() => {
      this.setData({ submitting: false })
    })
  }
})
