// app.js
const { getToken, clearToken } = require('./utils/auth')
const { baseUrl } = require('./config/env')

App({
  globalData: {
    userInfo: null,
    token: '',
    baseUrl
  },

  onLaunch() {
    this.globalData.token = getToken()
    this._checkUpdate()
    this._ensurePasswordChanged()
  },

  onShow() {
    // DAU 统计埋点（每次前台展示时触发）
    if (!this.globalData.token) return
    const auth = require('./utils/auth')
    if (auth.isMustChangePasswordRequired()) return
    this._trackActive()
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
  },

  // 冷启动：本地标记或服务端 session 均须改密时跳转改密页（auth/request 延迟 require，避免主包循环依赖）
  _ensurePasswordChanged() {
    if (!this.globalData.token) return
    const auth = require('./utils/auth')
    if (auth.isMustChangePasswordRequired()) {
      auth.redirectToChangePassword()
      return
    }
    const { get } = require('./utils/request')
    get('/auth/session', {}, { silent: true })
      .then((data) => {
        if (data && data.mustChangePassword) {
          auth.setMustChangePasswordFlag(true)
          auth.redirectToChangePassword()
        } else {
          auth.clearMustChangePasswordFlag()
        }
      })
      .catch(() => {})
  }
})
