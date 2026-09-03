// packageC/feedback/list.js — 我的反馈
const { getToken } = require('../../utils/auth')
const { get } = require('../../utils/request')
const { canAccessFeedback } = require('../../utils/feedbackPage')
const {
  feedbackDetailPath,
  buildFeedbackListFailurePatch,
  buildFeedbackListLoadedPatch
} = require('../../utils/feedbackMine')

Page({
  data: {
    list: [],
    loading: true,
    loadError: false,
    refreshError: false
  },

  onLoad() {
    if (!canAccessFeedback(!!getToken())) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => {
        wx.navigateBack({
          fail: () => wx.navigateTo({ url: '/pages/login/index' })
        })
      }, 400)
      return
    }
  },

  onShow() {
    if (!canAccessFeedback(!!getToken())) return
    this._load()
  },

  onPullDownRefresh() {
    this._load().finally(() => wx.stopPullDownRefresh())
  },

  onRetry() {
    this._load()
  },

  async _load() {
    const hasList = !!(this.data.list && this.data.list.length)
    this.setData({
      loading: !hasList,
      loadError: false,
      refreshError: false
    })
    try {
      const list = await get('/feedback/mine')
      this.setData(buildFeedbackListLoadedPatch(list))
    } catch (err) {
      console.warn('[feedback/list] 加载失败', err)
      this.setData(buildFeedbackListFailurePatch(hasList))
    }
  },

  onItemTap(e) {
    const url = feedbackDetailPath(e.currentTarget.dataset.id)
    if (!url) return
    wx.navigateTo({ url })
  },

  onCreate() {
    wx.navigateTo({ url: '/packageC/feedback/index' })
  }
})
