// packageD/ai-chat/history.js — AI 会话历史
const { fetchSessions, mapSessionItem } = require('../../utils/aiChat')
const { requireLogin } = require('../../utils/auth')

Page({
  data: {
    loading: true,
    list: []
  },

  onLoad() {
    if (!getApp().isLoggedIn()) {
      this.setData({ loading: false })
      requireLogin(() => this._load())
      return
    }
    this._load()
  },

  onShow() {
    if (getApp().isLoggedIn() && !this.data.loading) {
      this._load(false)
    }
  },

  async _load(showLoading = true) {
    if (showLoading) this.setData({ loading: true })
    try {
      const raw = await fetchSessions()
      const list = (raw || []).map(mapSessionItem).filter(Boolean)
      this.setData({ list, loading: false })
    } catch (err) {
      console.warn('[ai-chat/history] 加载失败', err)
      this.setData({ list: [], loading: false })
    }
  },

  onItemTap(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: `/packageD/ai-chat/index?sessionId=${id}` })
  },

  onNewChat() {
    wx.navigateTo({ url: '/packageD/ai-chat/index' })
  }
})
