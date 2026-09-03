// packageC/feedback/detail.js — 我的反馈详情
const { getToken } = require('../../utils/auth')
const { get } = require('../../utils/request')
const { canAccessFeedback } = require('../../utils/feedbackPage')
const { isFeedbackNotFound } = require('../../utils/feedbackMine')

Page({
  data: {
    loading: true,
    loadError: false,
    notFound: false,
    feedbackId: null,
    detail: null
  },

  onLoad(opts) {
    if (!canAccessFeedback(!!getToken())) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        wx.navigateBack({
          fail: () => wx.navigateTo({ url: '/pages/login/index' })
        })
      }, 400)
      return
    }
    const id = opts && opts.id
    if (!id) {
      this.setData({ loading: false, notFound: true })
      return
    }
    this.setData({ feedbackId: id })
    this._load(id)
  },

  onRetry() {
    const id = this.data.feedbackId
    if (!id) return
    this.setData({ loadError: false, notFound: false })
    this._load(id)
  },

  onBackList() {
    wx.navigateBack({
      fail: () => wx.redirectTo({ url: '/packageC/feedback/list' })
    })
  },

  async _load(id) {
    this.setData({ loading: true, loadError: false, notFound: false })
    try {
      const detail = await get(`/feedback/${id}`, null, { silent: true })
      this.setData({
        detail: detail || null,
        loading: false,
        loadError: false,
        notFound: !detail
      })
    } catch (err) {
      console.warn('[feedback/detail] 加载失败', err)
      if (isFeedbackNotFound(err)) {
        this.setData({ loading: false, notFound: true, loadError: false, detail: null })
        return
      }
      this.setData({ loading: false, loadError: true, notFound: false })
    }
  },

  onPreviewImage(e) {
    const current = e.currentTarget.dataset.src
    const urls = (this.data.detail && this.data.detail.images) || []
    if (!urls.length) return
    wx.previewImage({ current, urls })
  }
})
