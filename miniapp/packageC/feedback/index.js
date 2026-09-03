// packageC/feedback/index.js — 意见反馈（需登录，与后端一致）
const { getToken } = require('../../utils/auth')
const { post, upload } = require('../../utils/request')
const {
  MAX_IMAGES,
  normalizeUploadedUrl,
  remainingSlots,
  gateFeedbackSubmit,
  buildSubmitImagesOmittingFailed,
  resolveFeedbackSubmitToast,
  canRetryFeedbackImage,
  retryFeedbackImagePatch
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

  _uploadLocks() {
    if (!this._imageUploadLocks) this._imageUploadLocks = new Set()
    return this._imageUploadLocks
  },

  _tryLockUpload(id) {
    const locks = this._uploadLocks()
    if (locks.has(id)) return false
    locks.add(id)
    return true
  },

  _unlockUpload(id) {
    this._uploadLocks().delete(id)
  },

  _uploadOne(localPath) {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    if (!this._tryLockUpload(id)) return
    this.setData({ images: this.data.images.concat([{ id, localPath, url: '', uploading: true }]) })
    this._startUpload(id, localPath)
  },

  onRetryImage(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.images.find(it => it.id === id)
    if (!canRetryFeedbackImage(item, this._uploadLocks().has(id))) return
    if (!this._tryLockUpload(id)) return
    this._patchImage(id, retryFeedbackImagePatch())
    this._startUpload(id, item.localPath)
  },

  _startUpload(id, localPath) {
    upload('/miniapp/upload', localPath, 'file', {}, { silent: true }).then((data) => {
      const url = normalizeUploadedUrl(data)
      if (!url) throw new Error('invalid upload url')
      this._patchImage(id, { url, uploading: false, failed: false })
    }).catch((err) => {
      this._patchImage(id, { uploading: false, failed: true, url: '' })
      wx.showToast({ title: resolveUploadErrorMessage(err), icon: 'none', duration: 2800 })
    }).then(() => this._unlockUpload(id), () => this._unlockUpload(id))
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
    const gate = gateFeedbackSubmit(images)
    if (gate.kind === 'wait') {
      return wx.showToast({ title: '图片上传中，请稍候', icon: 'none' })
    }
    if (gate.kind === 'failed') {
      wx.showModal({
        title: '有图片上传失败',
        content: `还有 ${gate.failedCount} 张图片未上传成功。请点失败图片重试或删除后再提交；也可以不带这些图片继续。`,
        cancelText: '去处理',
        confirmText: '继续提交',
        success: (res) => {
          if (!res.confirm) return
          const latest = this.data.images
          const again = gateFeedbackSubmit(latest)
          if (again.kind === 'wait') {
            wx.showToast({ title: '图片上传中，请稍候', icon: 'none' })
            return
          }
          const omitted = again.kind === 'failed' ? again.failedCount : 0
          this._postFeedback(types[typeIndex], content, contact, buildSubmitImagesOmittingFailed(latest), omitted)
        }
      })
      return
    }
    this._postFeedback(types[typeIndex], content, contact, gate.imageUrls, 0)
  },

  _postFeedback(type, content, contact, imageUrls, omittedCount) {
    if (this.data.submitting) return
    const payload = {
      type,
      content: content.trim(),
      contact: contact.trim()
    }
    if (imageUrls.length) payload.images = imageUrls
    this.setData({ submitting: true })
    post('/feedback', payload).then(() => {
      this.setData({ submitting: false })
      const toast = resolveFeedbackSubmitToast(omittedCount)
      wx.showToast(toast)
      const wait = toast.duration || 1200
      setTimeout(() => wx.navigateBack(), wait)
    }).catch(() => {
      this.setData({ submitting: false })
    })
  }
})
