// pages/profile/index.js —— 个人中心（从首页顶栏「我的」进入）
const { getUserInfo, requireLogin } = require('../../utils/auth')
const { get } = require('../../utils/request')

Page({
  data: {
    userInfo: null,
    stats: { favorites: 0, enrolls: 0, downloads: 0, points: 0, unreadMessages: 0 },
    statsRefreshError: false,
    isLoggedIn: false
  },

  onShow() {
    const app = getApp()
    const loggedIn = app.isLoggedIn()
    this.setData({ isLoggedIn: loggedIn, userInfo: getUserInfo() })
    if (loggedIn) this._loadProfile()
  },

  onRetryStats() {
    if (!this.data.isLoggedIn) return
    this.setData({ statsRefreshError: false })
    this._loadStats({ silent: true })
  },

  async _loadProfile() {
    await Promise.all([
      this._loadUserProfile(),
      this._loadStats()
    ])
  },

  async _loadUserProfile() {
    try {
      const profile = await get('/profile')
      if (profile) this.setData({ userInfo: profile })
    } catch (err) {
      console.warn('[profile] 个人资料加载失败', err)
    }
  },

  async _loadStats(options = {}) {
    const { silent = false } = options
    const prev = this.data.stats
    const hadStats = !!(prev && (prev.favorites || prev.enrolls || prev.downloads || prev.points))
    if (!silent) this.setData({ statsRefreshError: false })
    try {
      const stats = await get('/profile/stats')
      if (stats) {
        this.setData({ stats, statsRefreshError: false })
      }
    } catch (err) {
      console.warn('[profile] 统计数据加载失败', err)
      if (silent && hadStats) {
        this.setData({ statsRefreshError: true })
      }
    }
  },

  onLoginTap() {
    wx.navigateTo({ url: '/pages/login/index' })
  },

  onEditProfile() {
    if (!this.data.isLoggedIn) {
      this.onLoginTap()
      return
    }
    wx.navigateTo({ url: '/packageC/profile/edit' })
  },

  /** 跳转个人中心子列表（收藏/报名/下载/足迹/徽章） */
  onStatTap(e) {
    if (!this.data.isLoggedIn) {
      this.onLoginTap()
      return
    }
    const type = e.currentTarget.dataset.type
    if (!type) return
    wx.navigateTo({ url: `/packageC/profile/list?type=${type}` })
  },

  onMessages() {
    if (!this.data.isLoggedIn) {
      this.onLoginTap()
      return
    }
    wx.navigateTo({ url: '/packageC/message/index' })
  },

  onAiChat() {
    wx.navigateTo({ url: '/packageD/ai-chat/index' })
  },

  onAiHistory() {
    if (!this.data.isLoggedIn) {
      this.onLoginTap()
      return
    }
    wx.navigateTo({ url: '/packageD/ai-chat/history' })
  },

  onFeedback() {
    requireLogin(() => {
      wx.navigateTo({ url: '/packageC/feedback/index' })
    })
  },

  onAbout() {
    wx.navigateTo({ url: '/packageC/about/index' })
  },

  onColleges() {
    wx.navigateTo({ url: '/packageC/college/list' })
  },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需重新登录',
      success: (res) => { if (res.confirm) getApp().logout() }
    })
  }
})
