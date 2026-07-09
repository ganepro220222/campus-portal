// pages/profile/index.js —— 个人中心（从首页顶栏「我的」进入）
const { getUserInfo } = require('../../utils/auth')
const { get } = require('../../utils/request')

Page({
  data: {
    userInfo:   null,
    stats:      { favorites: 0, enrolls: 0, downloads: 0, points: 0, unreadMessages: 0 },
    isLoggedIn: false
  },

  onShow() {
    const app = getApp()
    const loggedIn = app.isLoggedIn()
    this.setData({ isLoggedIn: loggedIn, userInfo: getUserInfo() })
    if (loggedIn) this._loadProfile()
  },

  async _loadProfile() {
    try {
      const [profile, stats] = await Promise.all([
        get('/profile').catch(() => null),
        get('/profile/stats').catch(() => null)
      ])
      this.setData({
        userInfo: profile || this.data.userInfo,
        stats:    stats || this.data.stats
      })
    } catch (err) {
      console.warn('[profile] 个人数据加载失败', err)
    }
  },

  onLoginTap() {
    wx.navigateTo({ url: '/pages/login/index' })
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

  onFeedback() {
    wx.navigateTo({ url: '/packageC/feedback/index' })
  },

  onAbout() {
    wx.navigateTo({ url: '/packageC/about/index' })
  },

  // 尚未实现的菜单项
  onTodo() {
    wx.showToast({ title: '功能开发中，敬请期待', icon: 'none' })
  },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需重新登录',
      success: (res) => { if (res.confirm) getApp().logout() }
    })
  }
})
