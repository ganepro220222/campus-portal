// app.js
const { getToken, clearToken } = require('./utils/auth')

App({
  globalData: {
    userInfo: null,
    token: '',
    baseUrl: 'http://localhost:8080/api/v1'
  },

  onLaunch() {
    this.globalData.token = getToken()
    this._checkUpdate()
  },

  onShow() {
    // DAU 统计埋点（每次前台展示时触发）
    if (this.globalData.token) {
      this._trackActive()
    }
  },

  // 判断是否已登录
  isLoggedIn() {
    return !!this.globalData.token
  },

  // 退出登录
  logout() {
    clearToken()
    this.globalData.token = ''
    this.globalData.userInfo = null
    wx.reLaunch({ url: '/pages/login/index' })
  },

  // 检查小程序更新
  _checkUpdate() {
    if (!wx.canIUse('getUpdateManager')) return
    const manager = wx.getUpdateManager()
    manager.onUpdateReady(() => {
      wx.showModal({
        title: '更新提示',
        content: '新版本已准备好，是否重启应用？',
        success(res) {
          if (res.confirm) manager.applyUpdate()
        }
      })
    })
  },

  // 上报活跃（DAU）
  _trackActive() {
    const { post } = require('./utils/request')
    post('/stats/active').catch(() => {})
  }
})
