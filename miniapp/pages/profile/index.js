// pages/profile/index.js
const { requireLogin, getUserInfo, clearToken } = require('../../utils/auth')
const { get } = require('../../utils/request')

Page({
  data: {
    userInfo:   null,
    stats:      { favorites: 0, enrolls: 0, downloads: 0, points: 0 },
    badges:     [],
    loading:    true,
    isLoggedIn: false
  },

  onShow() {
    const app = getApp()
    const loggedIn = app.isLoggedIn()
    this.setData({ isLoggedIn: loggedIn })
    if (loggedIn) this._loadProfile()
  },

  async _loadProfile() {
    try {
      const [profile, stats] = await Promise.all([
        get('/profile'),
        get('/profile/stats')
      ])
      this.setData({
        userInfo: profile,
        stats:    stats || this.data.stats,
        loading:  false
      })
    } catch {
      this.setData({ loading: false })
    }
  },

  onLoginTap() {
    wx.navigateTo({ url: '/pages/login/index' })
  },

  onEditProfile() {
    requireLogin(() => wx.navigateTo({ url: '/pages/profile/edit' }))
  },

  onFavoritesTap()  { requireLogin(() => wx.navigateTo({ url: '/pages/profile/favorites' })) },
  onEnrollsTap()    { requireLogin(() => wx.navigateTo({ url: '/pages/profile/enrolls' })) },
  onDownloadsTap()  { requireLogin(() => wx.navigateTo({ url: '/pages/profile/downloads' })) },
  onFootprintTap()  { requireLogin(() => wx.navigateTo({ url: '/pages/profile/footprint' })) },
  onBadgeTap()      { requireLogin(() => wx.navigateTo({ url: '/pages/profile/badges' })) },
  onFeedbackTap()   { requireLogin(() => wx.navigateTo({ url: '/pages/profile/feedback' })) },

  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出后需重新登录',
      success: (res) => {
        if (res.confirm) getApp().logout()
      }
    })
  }
})
