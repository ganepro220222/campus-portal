// pages/profile/index.js —— 个人中心（从首页顶栏「我的」进入）
const { PLACEHOLDER_COLLEGES } = require('../../utils/profileForm')

/*
 * profile.college 是后端返回的真实值，而历史数据里存的就是「贵州交通职业大学 · 中华文化书院」
 * 这类界面占位串——WXML 里那句 `userInfo.college || '中华文化书院'` 只在字段为空时才兜底，
 * 有值就原样显示，所以主体归属改完后个人中心仍然打着学校的名号。
 * 这里按占位串名单归一化：真实学院名照显，占位串一律显示书院名。
 */
const ACADEMY_NAME = '中华文化书院'
function collegeDisplay(profile) {
  const c = profile && profile.college
  return (c && !PLACEHOLDER_COLLEGES.includes(c)) ? c : ACADEMY_NAME
}

const { getUserInfo, requireLogin } = require('../../utils/auth')
const { get } = require('../../utils/request')

Page({
  data: {
    userInfo: null,
    collegeText: '',
    stats: { favorites: 0, enrolls: 0, downloads: 0, points: 0, unreadMessages: 0 },
    statsRefreshError: false,
    statsNumbersHidden: false,
    isLoggedIn: false
  },

  onShow() {
    const app = getApp()
    const loggedIn = app.isLoggedIn()
    const u = getUserInfo()
    this.setData({ isLoggedIn: loggedIn, userInfo: u, collegeText: collegeDisplay(u) })
    if (loggedIn) this._loadProfile()
  },

  onRetryStats() {
    if (!this.data.isLoggedIn) return
    this.setData({ statsRefreshError: false, statsNumbersHidden: false })
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
      if (profile) this.setData({ userInfo: profile, collegeText: collegeDisplay(profile) })
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
        this.setData({ stats, statsRefreshError: false, statsNumbersHidden: false })
      }
    } catch (err) {
      console.warn('[profile] 统计数据加载失败', err)
      this.setData({
        statsRefreshError: true,
        statsNumbersHidden: !hadStats
      })
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
